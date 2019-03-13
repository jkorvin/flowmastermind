function MemoryBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);

    self.yAxis.tickFormat(prefixBytesRound);
}


function TotalMemoryBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);

    self.yAxis.tickFormat(prefixBytesRound);
}


function LrcTotalMemoryBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);

    self.yAxis.tickFormat(prefixBytesRound);
}


function CouplesBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);
}

function UnusedGroupsBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);
}

function UnusedMemoryBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);
}

function KeysBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);

    self.max_value = 0;

    self.yAxis.tickFormat(function (val) {
        return prefixNumRound(val, self.max_value);
    });
}

function OutagesBar(container, chartLabel, chartLabelSmall) {

    var self = this;
    self.constructor.super.call(self, container, chartLabel, chartLabelSmall);
}


function Bar(container, chartLabel, chartLabelSmall) {

    var self = this;

    self.barCoef = 50;
    self.width = 100;
    self.height = 200;

    var barClickHandler = null;

    self.svg_container = d3.select(container).insert('svg', ':first-child');

    self.addLegend();

    self.svg = self.svg_container
            .attr('width', self.width + self.margin.left + self.margin.right)
            .attr('height', self.height + self.margin.bottom + self.margin.top)
        .append('g')
            .attr('transform', 'translate(' + self.margin.left + ',' + self.margin.top + ')');

    self.chart_label = self.svg_container
        .append('g')
            .attr('class', 'chart-label')
            .attr('transform', 'translate(' + self.margin.left + ',' + (self.margin.top + self.height + 30) + ')')
        .append('text')
            .attr('fill-opacity', 0)
            .attr('x', 0)
            .text(chartLabel);

    self.chart_label_small = undefined;
    if (chartLabelSmall) {
        self.chart_label_small = self.svg_container
            .append('g')
                .attr('class', 'chart-label-small')
                .attr('transform', 'translate(' + self.margin.left + ',' + (self.margin.top + self.height + 50) + ')')
            .append('text')
                .attr('fill-opacity', 0)
                .attr('x', 0)
                .text(chartLabelSmall);
    }

    self.tooltip = new Tooltip(true);
    self.tooltip.appendTo(container);

    self.yScale = d3.scale.linear()
        .domain([0, 100 * 1024 * 1024 * 1024])
        .range([self.height, 0]);

    self.xScale = d3.scale.ordinal()
        .rangeRoundBands([0, self.width], .08);

    self.xAxis = d3.svg.axis()
        .scale(self.xScale)
        .orient('bottom')
        .tickFormat(function (d) { return (d.length > 10) ? d.slice(0, 8) + '...' : d; });

    self.yAxis = d3.svg.axis()
        .scale(self.yScale)
        .ticks(8)
        .tickSize(-self.width)
        .orient('left');

    self.xAxisContainer = self.svg
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + self.height + ')')
        .call(self.xAxis);

    self.yAxisContainer = self.svg
        .append('g')
        .attr('class', 'y axis')
        .call(self.yAxis);
}

Bar.prototype.defaultPrepareData = function (rawdata) {
    var self = this;

    var rawdataEntries = d3.entries(rawdata).sort(function (a, b) { return (a.key < b.key) ? -1 : 1; });
    var data = [],
        keys = rawdataEntries.map(function (d) { return d.key; });

    var data_types = self.color.domain().slice();
    rawdataEntries.forEach(function (d, i) {
        var el = [];
        for (var index = 0; index < data_types.length; ++index) {
            el.push({x: d.key,
                     y: d.value[data_types[index]] ? d.value[data_types[index]] : 0,
                     type: data_types[index]});
        }
        data.push(el);
    });

    data = d3.transpose(d3.layout.stack()(d3.transpose(data)));

    return {data: data,
            keys: keys};

};

Bar.prototype.legend_per_line = 2;
Bar.prototype.labelLength = 150;
Bar.prototype.addLegend = function () {

    var self = this;

    self.legend = self.svg_container
        .append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + self.margin.left + ',0)');

    var labels = self.color.domain().slice(),
        colors = self.color.range().slice();

    var flatcl = d3.zip(colors, labels).reverse();
    var level = 0;
    var levelcl = [];
    while ((level + 1) * self.legend_per_line < labels.length) {
        levelcl.push(flatcl.slice(level * self.legend_per_line, (level + 1) * self.legend_per_line));
        ++level;
    }
    levelcl.push(flatcl.slice(level * self.legend_per_line));

    levelcl.forEach(function (cl, j) {
        cl.forEach(function (cl, i) {
            self.legend
                .append('rect')
                .attr('class', 'legend-colorsample')
                .attr('height', 10)
                .attr('width', 10)
                .attr('transform', 'translate(' + (i * self.labelLength) + ',' + (5 + (j * 15)) + ')')
                .style('fill', cl[0]);

            self.legend
                .append('text')
                .attr('class', 'legend-label')
                .attr('transform', 'translate(' + (i * self.labelLength + 15) + ',' + (5 + (j * 15)) + ')')
                .attr('y', 4)
                .text('— ' + self.labels[cl[1]]);
        });
    });

    self.margin.top = d3.max([self.margin.top, self.legend[0][0].getBBox().height + 20]);
};

function extend(Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
    Child.super = Parent;
}

extend(TotalMemoryBar, Bar);
extend(LrcTotalMemoryBar, Bar);
extend(MemoryBar, Bar);
extend(KeysBar, Bar);
extend(CouplesBar, Bar);
extend(UnusedGroupsBar, Bar);
extend(UnusedMemoryBar, Bar);
extend(OutagesBar, Bar);


MemoryBar.prototype.color = d3.scale.ordinal()
    .domain([
        'effective_removed_keys_size',
        'effective_used_space',
        'effective_uncommitted_keys_size',
        'reserved_effective_free_space',
        'wasted_effective_free_space',
        'downtimed_effective_free_space',
        'bad_effective_free_space',
        'effective_free_space',
        'uncoupled_space',
    ])
    .range([
        'rgb(97, 99, 232)',
        'rgb(200,200,200)',
        'rgb(224, 210, 122)',
        'rgb(58, 170, 209)',
        'rgb(184, 121, 209)',
        'rgb(68, 136, 255)',
        'rgb(240,72,72)',
        'rgb(78,201,106)',
        'rgb(242,238,96)',
    ]);

MemoryBar.prototype.labels = {
    effective_removed_keys_size: 'помечено удаленными',
    effective_used_space: 'закоммиченно',
    effective_uncommitted_keys_size: 'незакоммиченно',
    reserved_effective_free_space: 'зарезервировано свободное',
    wasted_effective_free_space: 'свободное в FROZEN|ARCHIVED капле',
    downtimed_effective_free_space: 'свободное в даунтайме',
    bad_effective_free_space: 'недоступно',
    effective_free_space: 'свободно',
    uncoupled_space: 'не используется',
};

MemoryBar.prototype.margin = {top: 50, right: 10, left: 50, bottom: 40};
MemoryBar.prototype.labelLength = 210;

MemoryBar.prototype.prepareData = Bar.prototype.defaultPrepareData;

MemoryBar.prototype.tooltipFormatter = prefixBytes;
MemoryBar.prototype.barLabelFormatter = prefixBytesRound;


TotalMemoryBar.prototype.color = d3.scale.ordinal()
    .domain([
        'removed_keys_size',
        'committed_keys_size',
        'uncommitted_keys_size',
        'downtimed_free_space',
        'bad_free_space',
        'free_space',
        'uncoupled_space',
    ]).range([
        'rgb(97, 99, 232)',
        'rgb(200,200,200)',
        'rgb(224, 210, 122)',
        'rgb(68, 136, 255)',
        'rgb(240,72,72)',
        'rgb(78,201,106)',
        'rgb(242,238,96)',
    ]);

TotalMemoryBar.prototype.labels = {
    removed_keys_size: 'удалено',
    committed_keys_size: 'закоммиченно',
    uncommitted_keys_size: 'незакоммиченно',
    downtimed_free_space: 'свободное в даунтайме',
    bad_free_space: 'недоступное свободное',
    free_space: 'свободно',
    uncoupled_space: 'не используется',
};

TotalMemoryBar.prototype.margin = {top: 50, right: 10, left: 50, bottom: 40};


TotalMemoryBar.prototype.prepareData = function (rawdata) {
    rawdataEntries = d3.entries(rawdata).sort(function (a, b) { return (a.key < b.key) ? -1 : 1; });

    var data = [],
        keys = rawdataEntries.map(function (d) { return d.key; });

    rawdataEntries.forEach(function (d, i) {
        var el = [];
        el.push({x: d.key,
                 y: d.value['removed_keys_size'],
                 type: 'removed_keys_size'});
        el.push({x: d.key,
                 y: d.value['used_space']
                    - d.value['removed_keys_size']
                    - d.value['uncommitted_keys_size'],
                 type: 'committed_keys_size'});
        el.push({x: d.key,
                 y: d.value['uncommitted_keys_size'],
                 type: 'uncommitted_keys_size'});
        el.push({x: d.key,
                 y: d.value['downtimed_free_space'],
                 type: 'downtimed_free_space'});
        el.push({x: d.key,
                 y: d.value['total_space']
                    - d.value['free_space']
                    - d.value['downtimed_free_space']
                    - d.value['used_space'],
                 type: 'bad_free_space'});
        el.push({x: d.key,
                 y: d.value['free_space'],
                 type: 'free_space'});
        el.push({x: d.key,
                 y: d.value['uncoupled_space'] ? d.value['uncoupled_space']: 0,
                 type: 'uncoupled_space'});
        data.push(el);
    });

    data = d3.transpose(
        d3.layout.stack()(d3.transpose(data)));

    return {data: data,
            keys: keys};
};


TotalMemoryBar.prototype.tooltipFormatter = prefixBytes;
TotalMemoryBar.prototype.barLabelFormatter = prefixBytesRound;


LrcTotalMemoryBar.prototype.color = d3.scale.ordinal()
    .domain([
        'removed_lrc_keys_size',
        'committed_lrc_keys_size',
        'uncommitted_lrc_keys_size',
        'downtimed_free_lrc_space',
        'bad_free_lrc_space',
        'free_lrc_space',
        'uncoupled_lrc_space',
        'reserved_lrc_space',
    ])
    .range([
        'rgb(97, 99, 232)',
        'rgb(200,200,200)',
        'rgb(224, 210, 122)',
        'rgb(68, 136, 255)',
        'rgb(240,72,72)',
        'rgb(78,201,106)',
        'rgb(246,244,158)',
        'rgb(133, 229, 219)',
    ]);

LrcTotalMemoryBar.prototype.labels = {
    removed_lrc_keys_size: 'помечено удаленными',
    committed_lrc_keys_size: 'закоммиченно',
    uncommitted_lrc_keys_size: 'незакоммиченно',
    downtimed_free_lrc_space: 'свободное в даунтайме',
    bad_free_lrc_space: 'недоступное свободное',
    free_lrc_space: 'свободно',
    uncoupled_lrc_space: 'не используется',
    reserved_lrc_space: 'зарезервировано',
};

LrcTotalMemoryBar.prototype.margin = {top: 50, right: 10, left: 50, bottom: 40};

LrcTotalMemoryBar.prototype.prepareData = function (rawdata) {
    var rawdataEntries = d3.entries(rawdata).sort(function (a, b) { return (a.key < b.key) ? -1 : 1; });

    var data = [],
        keys = rawdataEntries.map(function (d) { return d.key; });

    rawdataEntries.forEach(function (d, i) {
        var el = [];
        el.push({x: d.key,
                 y: d.value['removed_lrc_keys_size'],
                 type: 'removed_lrc_keys_size'});
        el.push({x: d.key,
                 y: d.value['used_lrc_space']
                    - d.value['uncommitted_lrc_keys_size']
                    - d.value['removed_lrc_keys_size'],
                 type: 'committed_lrc_keys_size'});
        el.push({x: d.key,
                 y: d.value['uncommitted_lrc_keys_size'],
                 type: 'uncommitted_lrc_keys_size'});
        el.push({x: d.key,
                 y: d.value['downtimed_free_lrc_space'],
                 type: 'downtimed_free_lrc_space'});
        el.push({x: d.key,
                 y: d.value['total_lrc_space']
                    - d.value['free_lrc_space']
                    - d.value['downtimed_free_lrc_space']
                    - d.value['used_lrc_space'],
                 type: 'bad_free_lrc_space'});
        el.push({x: d.key,
                 y: d.value['free_lrc_space'],
                 type: 'free_lrc_space'});
        el.push({x: d.key,
                 y: d.value['uncoupled_lrc_space'] ? d.value['uncoupled_lrc_space'] : 0,
                 type: 'uncoupled_lrc_space'});
        el.push({x: d.key,
                 y: d.value['reserved_lrc_space'] ? d.value['reserved_lrc_space'] : 0,
                 type: 'reserved_lrc_space'});
        data.push(el);
    });

    data = d3.transpose(
        d3.layout.stack()(d3.transpose(data)));

    return {data: data,
            keys: keys};
};

LrcTotalMemoryBar.prototype.tooltipFormatter = prefixBytes;
LrcTotalMemoryBar.prototype.barLabelFormatter = prefixBytesRound;


KeysBar.prototype.labels = {
    removed_keys: 'удаленные ключи',
    committed_keys: 'закоммиченные ключи',
    uncommitted_keys: 'незакоммиченные ключи',
};

KeysBar.prototype.margin = {top: 50, right: 10, left: 70, bottom: 40};

KeysBar.prototype.color = d3.scale.ordinal()
    .domain([
        'removed_keys',
        'committed_keys',
        'uncommitted_keys',
    ]).range([
        'rgb(121,146,155)',
        'rgb(232,207,179)',
        'rgb(210, 232, 169)',
    ]);


KeysBar.prototype.prepareData = Bar.prototype.defaultPrepareData;

KeysBar.prototype.tooltipFormatter = function (val) {
    return intGroupsDelimiter(val, ',');
};
KeysBar.prototype.barLabelFormatter = function (val) {
    return prefixNumRound(val, self.max_value);
};

CouplesBar.prototype.color = d3.scale.ordinal()
    .domain([
        'bad_couples',
        'broken_couples',
        'archived_couples',
        'closed_couples',
        'frozen_couples',
        'open_couples',
        'downtimed_couples',
        'service_active_couples',
        'service_stalled_couples',
        'uncoupled_groups',
    ]).range([
        'rgb(240,72,72)',
        'rgb(150,35,0)',
        'rgb(120,120,120)',
        'rgb(200,200,200)',
        'rgb(150,197,255)',
        'rgb(78,201,106)',
        'rgb(68, 136, 255)',
        'rgb(220, 110, 220)',
        'rgb(140, 70, 140)',
        'rgb(242,238,96)',
    ]);

CouplesBar.prototype.labels = {
    bad_couples: 'недоступные для записи каплы',
    broken_couples: 'каплы с ошибкой конфигурации',
    archived_couples: 'отправленные в архив каплы',
    closed_couples: 'заполненные каплы',
    frozen_couples: 'замороженные каплы',
    open_couples: 'открытые на запись каплы',
    downtimed_couples: 'каплы в даунтайме',
    service_active_couples: 'каплы в сервисе',
    service_stalled_couples: 'проблемные каплы в сервисе',
    uncoupled_groups: 'групп не в капле'
};

CouplesBar.prototype.margin = {top: 50, right: 10, left: 50, bottom: 40};
CouplesBar.prototype.labelLength = 185;

CouplesBar.prototype.prepareData = Bar.prototype.defaultPrepareData;


UnusedGroupsBar.prototype.color = d3.scale.ordinal()
    .domain([
        'uncoupled_groups',
        'uncoupled_cache_groups',
        'uncoupled_lrc_groups',
        'reserved_lrc_groups',
        'unused_locked_groups',
        'bad_unused_groups',
    ]).range([
        'rgb(229, 214, 137)',
        'rgb(211, 219, 199)',
        'rgb(139, 232, 205)',
        'rgb(139, 213, 232)',
        'rgb(184, 121, 209)',
        'rgb(240,72,72)',
    ]);

UnusedGroupsBar.prototype.labels = {
    uncoupled_groups: 'для реплики',
    uncoupled_cache_groups: 'для кэша',
    uncoupled_lrc_groups: 'для lrc',
    reserved_lrc_groups: 'зарезервированные для lrc',
    unused_locked_groups: 'заблокированные',
    bad_unused_groups: 'недоступные',
};

UnusedGroupsBar.prototype.margin = {top: 50, right: 10, left: 50, bottom: 40};
UnusedGroupsBar.prototype.labelLength = 160;
UnusedGroupsBar.prototype.prepareData = Bar.prototype.defaultPrepareData;

UnusedMemoryBar.prototype.color = d3.scale.ordinal()
    .domain([
        'uncoupled_space',
        'uncoupled_cached_space',
        'uncoupled_lrc_space',
        'reserved_lrc_space',
        'unused_locked_space',
        'bad_unused_space',
        'future_backends_space',
    ]).range([
        'rgb(229, 214, 137)',
        'rgb(211, 219, 199)',
        'rgb(139, 232, 205)',
        'rgb(139, 213, 232)',
        'rgb(184, 121, 209)',
        'rgb(240,72,72)',
        'rgb(68, 136, 255)',
    ]);

UnusedMemoryBar.prototype.labels = {
    uncoupled_space: 'для реплики',
    uncoupled_cached_space: 'для кэша',
    uncoupled_lrc_space: 'для lrc',
    reserved_lrc_space: 'зарезервированное для lrc',
    unused_locked_space: 'заблокированное',
    bad_unused_space: 'недоступное',
    future_backends_space: 'удалённые бэкенды',
};

UnusedMemoryBar.prototype.margin = {top: 50, right: 10, left: 50, bottom: 40};
UnusedMemoryBar.prototype.labelLength = 160;
UnusedMemoryBar.prototype.prepareData = Bar.prototype.defaultPrepareData;

UnusedMemoryBar.prototype.tooltipFormatter = prefixBytes;
UnusedMemoryBar.prototype.barLabelFormatter = prefixBytesRound;

OutagesBar.prototype.color = d3.scale.ordinal()
    .domain([
        'bad_couples',
        'broken_couples',
        'archived_couples',
        'closed_couples',
        'frozen_couples',
        'open_couples',
        'downtimed_couples',
        'service_active_couples',
        'service_stalled_couples',
    ]).range([
        'rgb(240,72,72)',
        'rgb(150,35,0)',
        'rgb(120,120,120)',
        'rgb(200,200,200)',
        'rgb(150,197,255)',
        'rgb(78,201,106)',
        'rgb(68, 136, 255)',
        'rgb(220, 110, 220)',
        'rgb(140, 70, 140)',
    ]);

OutagesBar.prototype.labels = {
    bad_couples: 'недоступно для записи',
    broken_couples: 'ошибка конфигурации',
    archived_couples: 'архив',
    closed_couples: 'заполнены',
    frozen_couples: 'заморожено',
    open_couples: 'открыто на запись',
    downtimed_couples: 'в даунтайме',
    service_active_couples: 'в сервисе',
    service_stalled_couples: 'проблемные в сервисе',
};

OutagesBar.prototype.margin = {top: 50, right: 10, left: 50, bottom: 40};

OutagesBar.prototype.legend_per_line = 2;
OutagesBar.prototype.labelLength = 170;

OutagesBar.prototype.prepareData = function (rawdata) {
    var self = this;

    var rawdataEntries = d3.entries(rawdata).sort(function (a, b) { return (a.key < b.key) ? -1 : 1; });
    var data = [],
        keys = rawdataEntries.map(function (d) { return d.key; });

    var data_types = self.color.domain().slice();
    rawdataEntries.forEach(function (d, i) {
        var el = [];
        for (var index = 0; index < data_types.length; ++index) {
            el.push({x: d.key,
                     y: d.value['outages'][data_types[index]] ? d.value['outages'][data_types[index]] : 0,
                     type: data_types[index]});
        }
        data.push(el);
    });

    data = d3.transpose(d3.layout.stack()(d3.transpose(data)));

    return {data: data,
            keys: keys};

};


Bar.prototype.tooltipFormatter = function (d) { return d; };
Bar.prototype.barLabelFormatter = function (d) { return d; };


Bar.prototype.update = function (rawdata) {

    var self = this;

    var data = self.prepareData(rawdata);

    self.updateSize(data.keys.length);
    self.updateAxes(data.data, data.keys);
    self.updateBars(data.data);
};


Bar.prototype.updateSize = function (bars_num) {

    var self = this;

    self.width = bars_num * self.barCoef;

    self.width = d3.max([self.width, self.legend[0][0].getBBox().width]);

    self.svg_container
            .attr('width', self.width + self.margin.left + self.margin.right);

    self.legend
        .attr('transform', 'translate(' + (self.margin.left) + ',0)');

    self.chart_label
        .transition()
        .duration(500)
        .attr('fill-opacity', 1)
        .attr('x', Math.round(self.width / 2));

    if (self.chart_label_small) {
        self.chart_label_small
            .transition()
            .duration(500)
            .attr('fill-opacity', 1)
            .attr('x', Math.round(self.width / 2));
    }
};

Bar.prototype.updateAxes = function (data, keys) {

    var self = this,
        yMax = d3.max(data.map(
            function (d) { return d3.max(d, function (e) {return e.y0 + e.y; }); }));

    self.yAxis.tickSize(-self.width);

    self.xScale.rangeRoundBands([0, keys.length * self.barCoef], .08);
    self.yScale.domain([0, yMax]);

    self.xScale.domain(keys);

    self.yAxisContainer
        .transition()
        .duration(500)
        .call(self.yAxis);

    self.xAxisContainer
        .transition()
        .duration(500)
        .call(self.xAxis);
};

Bar.prototype.updateBars = function (data) {

    var self = this;

    self.svg.selectAll('g.bar')
        .data(data)
        .enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', function (d, i) { return 'translate(' + self.xScale(d[0].x) + ',0)'; });

    self.removeTooltipHandlers();

    var updated_bars = self.svg.selectAll('g.bar')
        .selectAll('g.barpart')
        .data(function (d) { return d; });

    var new_bars = updated_bars
        .enter()
            .append('g')
            .attr('class', 'barpart');

    new_bars
            .append('rect')
            .attr('y', self.yScale(0))
            .attr('width', self.xScale.rangeBand())
            .attr('height', 0)
            .attr('fill', function (d, i) { return self.color(d.type) });

    new_bars
            .append('text')
            .attr('class', 'barlabel')
            .attr('x', function (d) { return self.xScale.rangeBand() / 2; })
            .attr('y', self.yScale(0));

    if (self.barClickHandler) {
        new_bars.on('click', function () {
            self.mouseLeave();
            /* pass some parameters, should decide which ones are needed */
            return self.barClickHandler(this.__data__.x, this.__data__.y);
        })
    }


    self.svg.selectAll('g.bar').selectAll('rect')
        .data(function (d) { return d; })
        .attr('fill-opacity', 0.6)
        .transition()
        .duration(500)
        .attr('y', function (d) { return self.yScale(d.y0 + d.y); })
        .attr('height', function (d) { return self.yScale(d.y0) - self.yScale(d.y0 + d.y); })
        .endall(function () { self.addTooltipHandlers(); });


    self.svg.selectAll('g.bar').selectAll('text')
        .data(function (d) { return d; })
        .transition()
        .duration(500)
        .delay(function (d, i) { return i * 50; })
        .attr('y', function (d) { return self.yScale(d.y0 + d.y) + (self.yScale(d.y0) - self.yScale(d.y0 + d.y)) / 2; })
        .text(function (d) { return (self.yScale(d.y0) - self.yScale(d.y0 + d.y) >= 15 ) ? self.barLabelFormatter(d.y) : ''; });
};

Bar.prototype.addTooltipHandlers = function () {
    var self = this,
        bars = self.svg.selectAll('g.barpart'),
        rects = self.svg.selectAll('rect');

    bars.on('mouseenter', function () {

        var data = this.__data__,
            curleft = self.xScale(data.x),
            curtop = d3.select(this).select('rect').attr('y'),
            testbarpart = d3.select(this).select('rect')[0][0];

        rects.transition()
            .duration(200)
            .style('fill-opacity', function (d) { return (this != testbarpart) ? 0.4 : 0.8 });

        self.tooltip.show(+curtop + self.margin.top - 10,
                          curleft + self.margin.left + Math.round(self.xScale.rangeBand()/2));
        self.tooltip.setDC(data.x);

        self.tooltip.setSpaceLabel(self.labels[data.type] + ': ');
        self.tooltip.setSpaceValue(self.tooltipFormatter(data.y));
    });

    bars.on('mouseleave', function () {
        self.mouseLeave();
    });
};

Bar.prototype.mouseLeave = function () {
    var self = this,
        rects = self.svg.selectAll('rect');

    rects.transition()
        .duration(200)
        .style('fill-opacity', 0.6);

    self.tooltip.hide();
}

Bar.prototype.onBarClick = function (handler) {
    var self = this;
    self.barClickHandler = handler;
}

Bar.prototype.removeTooltipHandlers = function () {
    var self = this,
        rects = self.svg.selectAll('rect');

    rects.on('mouseenter', null);
    rects.on('mouseleave', null);
};
