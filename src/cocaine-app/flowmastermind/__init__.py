# NB: this import have to be executed as early as possible
#     to guarantee proper initialization of ioloops in
#     each process of cocaine pool
from flowmastermind.request import request as cocaine_request

import datetime
from functools import wraps
import json
import time
import traceback
import urllib2

import msgpack

from cocaine.logger import Logger
from flask import Flask, request
from flask import abort, render_template

from flowmastermind.auth import auth_controller
from flowmastermind.config import config
from flowmastermind.error import ApiResponseError, AuthenticationError, AuthorizationError
from flowmastermind.jobs import job_types, job_types_groups, job_statuses
from flowmastermind.response import JsonResponse


logging = Logger()

app = Flask(__name__)


DEFAULT_DT_FORMAT = '%Y-%m-%d %H:%M:%S'
JOBS_FILTER_DT_FIELD_FORMAT = '%Y/%m/%d %H:%M'


def json_response(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            res = {'status': 'success',
                   'response': func(*args, **kwargs)}
        except AuthenticationError as e:
            logging.error('User is not authenticated, request: {0}'.format(dir(request)))
            res = {'status': 'error',
                   'error_code': 'AUTHENTICATION_FAILED',
                   'error_message': 'authentication required'}
            if e.url:
                res['url'] = e.url
        except AuthorizationError as e:
            logging.error('User is not authorized, request: {0}'.format(dir(request)))
            res = {'status': 'error',
                   'error_code': 'AUTHORIZATION_FAILED',
                   'error_message': str(e),
                   'login': e.login}
        except ApiResponseError as e:
            logging.error('API error: {0}'.format(e))
            logging.error(traceback.format_exc())
            res = {'status': 'error',
                   'error_code': e.code,
                   'error_message': e.msg}
        except Exception as e:
            logging.error(e)
            logging.error(traceback.format_exc())
            res = {'status': 'error',
                   'error_code': 'UNKNOWN',
                   'error_message': str(e)}

        return JsonResponse(json.dumps(res))

    return wrapper


def mastermind_response(response):
    if isinstance(response, dict):
        if 'Balancer error' in response:
            raise RuntimeError(response['Balancer error'])
        if 'Error' in response:
            raise RuntimeError(response['Error'])
    return response


@app.route('/')
def charts():
    try:
        return render_template('charts.html', menu_page='charts')
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/ping')
def ping():
    try:
        return 'pong'
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/commands/')
def commands():
    try:
        return render_template(
            'commands.html',
            menu_page='commands',
            cur_page='commands',
        )
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/commands/history/')
@app.route('/commands/history/<year>/<month>/')
def history(year=None, month=None):
    try:
        if year is None:
            dt = datetime.datetime.now()
            year, month = dt.year, dt.month
        try:
            dt = datetime.datetime(int(year), int(month), 1)
        except ValueError:
            abort(404)
        return render_template(
            'commands_history.html',
            year=year,
            month=month,
            menu_page='commands',
            cur_page='history',
        )
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


SUPPORTED_JOB_TYPES = (
    'move',
    'recovery',
    'defrag',
    'restore',
    'move-lrc-groups',
    'lrc-groups',
    'lrc-groups-restore',
    'lrc-recovery',
    'lrc-remove',
    'lrc-defrag',
    'cleanup',
    'backend_cleanup',
    'couple-remove-groupset',
    'eblob_kit',
)


@app.route('/job/<job_id>/')
def job(job_id):
    return render_template(
        'job.html',
        menu_page='jobs',
        job_id=job_id,
    )


@app.route('/jobs/filter/')
def jobs_filter():
    try:
        return render_template(
            'jobs_filter.html',
            job_types=job_types,
            job_types_groups=job_types_groups,
            job_statuses=job_statuses,
        )
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/jobs/')
@app.route('/jobs/<job_type>/')
@app.route('/jobs/<job_type>/<job_status>/')
@app.route('/jobs/<job_type>/<job_status>/<year>/<month>/')
def jobs(job_type=None, job_status=None, year=None, month=None):

    if job_type is None:
        job_type = 'move'

    if job_status is None:
        job_status = 'not-approved'

    if job_type not in SUPPORTED_JOB_TYPES:
        abort(404)
    if job_status not in ('not-approved', 'executing', 'pending', 'finished'):
        abort(404)

    tag = None

    try:

        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        if not month:
            dt = datetime.datetime.now().replace(day=1)
        else:
            dt = datetime.date(int(year), int(month), 1)

        tag = dt.strftime('%Y-%m')
        prev_dt = dt - datetime.timedelta(days=1)

        return render_template(
            'jobs.html',
            menu_page='jobs',
            cur_page=job_type,
            job_type=job_type,
            job_status=job_status,
            tag=tag,
            previous_year=prev_dt.year,
            previous_month='{0:02d}'.format(prev_dt.month),
            cur_year=dt.year,
            cur_month='{0:02d}'.format(dt.month),
            limit=limit,
            offset=offset,
            next_offset=limit + offset,
        )
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/monitor/couple-free-effective-space/')
def monitor_couple_free_eff_space():
    try:
        return render_template(
            'couple_free_effective_space.html',
            menu_page='monitor')
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/stat/')
def json_stat():
    try:
        stats = cocaine_request('get_flow_stats', msgpack.packb(None))
        return JsonResponse(json.dumps(stats))
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/commands/')
def json_commands():
    try:
        resp = cocaine_request('get_commands', msgpack.packb(None))
        resp = JsonResponse(json.dumps(resp))
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/commands/history/<year>/<month>/')
def json_commands_history(year, month):
    try:
        resp = cocaine_request('minion_history_log', msgpack.packb([year, month]))
        resp = JsonResponse(json.dumps(resp))
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


def ts_to_dt(ts):
    return datetime.datetime.fromtimestamp(float(ts)).strftime(DEFAULT_DT_FORMAT)


@app.route('/json/jobs/update/', methods=['POST'])
@json_response
def json_jobs_update():

    try:
        job_ids = request.form.getlist('jobs[]')
        logging.info('Job ids: {0}'.format(job_ids))

        resp = cocaine_request('get_jobs_status', msgpack.packb([job_ids]))

        def convert_tss_to_dt(d):
            if d.get('create_ts'):
                d['create_ts'] = ts_to_dt(d['create_ts'])
            if d['start_ts']:
                d['start_ts'] = ts_to_dt(d['start_ts'])
            if d['finish_ts']:
                d['finish_ts'] = ts_to_dt(d['finish_ts'])

        for r in resp:
            convert_tss_to_dt(r)
            for error_msg in r.get('error_msg', []):
                error_msg['ts'] = ts_to_dt(error_msg['ts'])
            for task in r['tasks']:
                convert_tss_to_dt(task)

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


MM_JOB_TYPES = {
    'move': 'move_job',
    'recovery': 'recover_dc_job',
    'defrag': 'couple_defrag_job',
    'restore': (
        'restore_group_job',
    ),
    'move-lrc-groups': 'move_lrc_groupset_job',
    'lrc-groups': (
        'make_lrc_groups_job',
        'make_lrc_reserved_groups_job',
        'add_lrc_groupset_job',
        'convert_to_lrc_groupset_job',
        'add_groupset_to_couple_job',
    ),
    'lrc-groups-restore': (
        'restore_lrc_group_job',
        'restore_uncoupled_lrc_group_job',
    ),
    'lrc-recovery': (
        'recover_lrc_groupset_job',
    ),
    'lrc-remove': (
        'remove_lrc_groupset_job',
    ),
    'lrc-defrag': (
        'defrag_lrc_groupset_job',
    ),
    'cleanup': (
        'ttl_cleanup_job',
    ),
    'backend_cleanup': (
        'backend_cleanup_job',
    ),
    'couple-remove-groupset': (
        'discard_groupset_job',
    ),
    'eblob_kit': (
        'fix_eblobs_job',
    ),
}

MM_JOB_STATUSES = {
    'not-approved': ['not_approved'],
    'executing': ['new', 'executing'],
    'pending': ['pending', 'broken'],
    'finished': ['completed', 'cancelled'],
}


@app.route('/json/jobs/<job_id>/')
@app.route('/json/jobs/<job_type>/<job_status>/')
@app.route('/json/jobs/<job_type>/<job_status>/<tag>/')
@json_response
def json_jobs_list(job_id=None, job_type=None, job_status=None, tag=None):

    if job_id:
        params = {
            'ids': [job_id],
        }
    else:
        if job_type not in SUPPORTED_JOB_TYPES:
            abort(404)
        if job_status not in ('not-approved', 'executing', 'pending', 'finished'):
            abort(404)

        limit = request.args.get('limit', 50)
        offset = request.args.get('offset', 0)

        params = {
            'job_type': MM_JOB_TYPES[job_type],
            'tag': tag,
            'statuses': MM_JOB_STATUSES[job_status],
            'limit': limit,
            'offset': offset,
        }

    try:

        resp = cocaine_request('get_job_list', msgpack.packb([params]))

        def convert_tss_to_dt(d):
            if d.get('create_ts'):
                d['create_ts'] = ts_to_dt(d['create_ts'])
            if d['start_ts']:
                d['start_ts'] = ts_to_dt(d['start_ts'])
            if d['finish_ts']:
                d['finish_ts'] = ts_to_dt(d['finish_ts'])

        for r in resp['jobs']:
            convert_tss_to_dt(r)
            for error_msg in r.get('error_msg', []):
                error_msg['ts'] = ts_to_dt(error_msg['ts'])
            for task in r['tasks']:
                convert_tss_to_dt(task)

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


def dt_to_ts(s, format=DEFAULT_DT_FORMAT):
    if not s:
        return None
    dt = datetime.datetime.strptime(s, format)
    return int(time.mktime(dt.timetuple()))


@app.route('/json/jobs/filter/')
@json_response
def json_jobs_filter():
    limit = request.args.get('limit', 50)
    offset = request.args.get('offset', 0)

    types = request.args.getlist('job_types') or None
    statuses = request.args.getlist('job_statuses') or None

    min_create_ts = dt_to_ts(
        request.args.get('min_create_ts'),
        format=JOBS_FILTER_DT_FIELD_FORMAT,
    )
    max_create_ts = dt_to_ts(
        request.args.get('max_create_ts'),
        format=JOBS_FILTER_DT_FIELD_FORMAT,
    )
    min_finish_ts = dt_to_ts(
        request.args.get('min_finish_ts'),
        format=JOBS_FILTER_DT_FIELD_FORMAT,
    )
    max_finish_ts = dt_to_ts(
        request.args.get('max_finish_ts'),
        format=JOBS_FILTER_DT_FIELD_FORMAT,
    )

    ids = None
    ids_values = json.loads(request.args.get('tags_ids'))
    if ids_values:
        ids = ids_values

    def ident(x):
        return x

    tag_types = (
        ('namespaces', 'namespaces', ident),
        ('couples', 'couple_ids', int),
        ('groupsets', 'groupset_ids', ident),
        ('groups', 'group_ids', int),
        ('hostnames', 'hostnames', ident),
        ('paths', 'paths', ident),
    )

    tags = {}
    for tag_type, tag_request_type, map_processor in tag_types:
        tag_values = json.loads(request.args.get('tags_' + tag_type))
        if tag_values:
            tags[tag_request_type] = map(map_processor, tag_values)

    params = {
        'ids': ids,
        'types': types,
        'statuses': statuses,
        'tags': tags,
        'min_create_ts': min_create_ts,
        'max_create_ts': max_create_ts,
        'min_finish_ts': min_finish_ts,
        'max_finish_ts': max_finish_ts,
        'limit': limit,
        'offset': offset,
    }

    logging.debug('Job filter request params: {}'.format(params))

    try:
        resp = cocaine_request('get_job_list', msgpack.packb([params]))

        def convert_tss_to_dt(d):
            if d.get('create_ts'):
                d['create_ts'] = ts_to_dt(d['create_ts'])
            if d['start_ts']:
                d['start_ts'] = ts_to_dt(d['start_ts'])
            if d['finish_ts']:
                d['finish_ts'] = ts_to_dt(d['finish_ts'])

        for r in resp['jobs']:
            convert_tss_to_dt(r)
            for error_msg in r.get('error_msg', []):
                error_msg['ts'] = ts_to_dt(error_msg['ts'])
            for task in r['tasks']:
                convert_tss_to_dt(task)

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/jobs/retry/<job_id>/<task_id>/')
@json_response
@auth_controller.check_auth
def json_retry_task(job_id, task_id):
    try:
        resp = cocaine_request(
            'retry_failed_job_task',
            msgpack.packb([job_id, task_id])
        )

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/jobs/skip/<job_id>/<task_id>/')
@json_response
@auth_controller.check_auth
def json_skip_task(job_id, task_id):
    try:
        resp = cocaine_request(
            'skip_failed_job_task',
            msgpack.packb([job_id, task_id])
        )

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/jobs/cancel/<job_id>/')
@json_response
@auth_controller.check_auth
def json_cancel_job(job_id):
    try:
        resp = cocaine_request(
            'cancel_job',
            msgpack.packb([job_id])
        )

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/jobs/restart/<job_id>/')
@json_response
@auth_controller.check_auth
def json_restart_job(job_id):
    try:
        resp = cocaine_request(
            'restart_failed_to_start_job',
            msgpack.packb([job_id])
        )

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/jobs/refinish/<job_id>/')
@json_response
@auth_controller.check_auth
def json_refinish_job(job_id):
    try:
        resp = cocaine_request(
            'restart_failed_to_finish_job',
            msgpack.packb([job_id])
        )

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/jobs/approve/<job_id>/')
@json_response
@auth_controller.check_auth
def json_approve_job(job_id):
    try:
        resp = cocaine_request(
            'approve_job',
            msgpack.packb([job_id])
        )

        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/map/')
@app.route('/json/map/<namespace>/')
@json_response
def json_treemap(namespace=None):
    try:
        options = {
            'namespace': namespace,
            'couple_status': request.args.get('couple_status')
        }
        resp = cocaine_request(
            'get_groups_tree',
            msgpack.packb([options])
        )
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/group/<group_id>/')
@json_response
def json_group_info(group_id):
    try:
        resp = cocaine_request(
            'get_couple_statistics',
            msgpack.packb([int(group_id)])
        )
        return resp
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


STATE_URL_TPL = 'http://{host}:{port}/command/status/{uid}/'

MINIONS_CFG = config.get('minions', {})


@app.route('/json/commands/status/<uid>/')
@json_response
def json_command_status(uid):
    resp = cocaine_request(
        'get_command',
        msgpack.packb([uid.encode('utf-8')])
    )
    resp = mastermind_response(resp)

    url = STATE_URL_TPL.format(
        host=resp['host'],
        port=MINIONS_CFG.get('port', 8081),
        uid=uid,
    )

    req = urllib2.Request(url)
    if 'authkey' in MINIONS_CFG:
        req.add_header('X-Auth', MINIONS_CFG['authkey'])

    try:
        r = urllib2.urlopen(
            req,
            timeout=MINIONS_CFG.get('timeout', 5),
        )
        command_response = json.loads(r.read())
    except Exception as e:
        resp['output'] = 'Failed to fetch stdout from minions: {}'.format(e)
        resp['error_output'] = 'Failed to fetch stderr from minions: {}'.format(e)
    else:
        if command_response['status'] == 'success':
            command_data = command_response['response'][uid]
            resp['output'] = command_data['output']
            resp['error_output'] = command_data['error_output']
        else:
            error = command_response['error']
            resp['output'] = 'Failed to fetch stdout from minions: {}'.format(error)
            resp['error_output'] = 'Failed to fetch stderr from minions: {}'.format(error)

    return resp


@app.route('/json/monitor/couple-free-effective-space/<namespace>/')
@json_response
def json_monitor_couple_free_eff_space(namespace):
    limit = request.args.get('limit')
    offset = request.args.get('offset', 0)
    request_params = {
        'limit': limit,
        'offset': offset,
    }
    try:
        samples = cocaine_request(
            'get_monitor_effective_free_space',
            msgpack.packb([
                namespace,
                request_params
            ])
        )
        return samples
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


@app.route('/json/namespaces/')
@json_response
def json_namespaces():
    filter = {
        'deleted': False
    }
    try:
        stats = cocaine_request(
            'get_namespaces_list',
            msgpack.packb([filter])
        )
        return stats
    except Exception as e:
        logging.error(e)
        logging.error(traceback.format_exc())
        raise


if __name__ == '__main__':
    app.run(debug=True)
