// function MemoryPie(container) {
//     var self = this;
//     self.constructor.super.call(self, container);
// }

function EffectiveMemoryPie(container, chartLabel, renderLabels) {
    var self = this;
    self.width = 180;
    self.constructor.super.call(self, container, chartLabel, renderLabels);
}

function LrcEffectiveMemoryPie(container, chartLabel, renderLabels) {
    var self = this;
    self.width = 170;
    self.constructor.super.call(self, container, chartLabel, renderLabels);
}

function TotalMemoryPie(container, chartLabel, renderLabels) {
    var self = this;
    self.width = 160;
    self.constructor.super.call(self, container, chartLabel, renderLabels);
}

function LrcMemoryPie(container, chartLabel, renderLabels) {
    var self = this;
    self.width = 150;
    self.constructor.super.call(self, container, chartLabel, renderLabels);
}

function CouplesPie(container, chartLabel, renderLabels) {
    var self = this;
    self.width = 275;
    self.constructor.super.call(self, container, chartLabel, renderLabels);
}

function UnusedGroupsPie(container, chartLabel, renderLabels) {
    var self = this;
    self.width = 150;
    self.constructor.super.call(self, container, chartLabel, renderLabels);
}

function UnusedSpacePie(container, chartLabel, renderLabels) {
    var self = this;
    self.width = 220;
    self.constructor.super.call(self, container, chartLabel, renderLabels);
}

function Pie(container, chartLabel, renderLabels) {
    var self = this;

    self.height = 150;

    self.svg_container = d3.select(container).insert('svg', ':first-child');

    if (renderLabels) {
        self.addLegend();
        self.width = d3.max([self.width, self.legend[0][0].getBBox().width]);
    }

    self.chart_label = self.svg_container
        .append('g')
            .attr('class', 'chart-label')
            .attr('transform', 'translate(' + self.margin.left + ',' + (self.margin.top + self.height + 30) + ')')
        .append('text')
            .attr('fill-opacity', 1)
            .text(chartLabel);
    self.width = d3.max([self.width, self.chart_label[0][0].getBBox().width]);
    self.chart_label[0][0].setAttribute('x', self.width / 2);

    self.svg = self.svg_container
        .attr('width', self.width + self.margin.left + self.margin.right)
        .attr('height', self.height + self.margin.bottom + self.margin.top)
    .append('g')
        .attr('transform', 'translate(' + self.margin.left + ',' + self.margin.top + ')');


    self.tooltip = new Tooltip();
    self.tooltip.appendTo(container);

    self.gpie = self.svg
        .append('g')
        .attr('transform', 'translate(' + (self.width / 2) + ',' + (self.height / 2) + ')');

    self.pie = d3.layout.pie()
        .value(function (d) { return d.value; })
        .sort(null);

    self.arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(Math.round(self.height / 2));
    self.labelArc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(Math.round(self.height / 2) + 15);
}

Pie.prototype.defaultPrepareData = function (rawdata) {
    var self = this;

    var data = [];

    var data_types = self.color.domain().slice();
    for (var index = 0; index < data_types.length; ++index) {
        data.push({value: rawdata[data_types[index]] ? rawdata[data_types[index]] : 0,
                   type: data_types[index]});
    }

    return {data: data};
};

function extend(Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
    Child.super = Parent;
}

// extend(MemoryPie, Pie);
extend(EffectiveMemoryPie, Pie);
extend(LrcEffectiveMemoryPie, Pie);
extend(TotalMemoryPie, Pie);
extend(LrcMemoryPie, Pie);
extend(CouplesPie, Pie);
extend(UnusedGroupsPie, Pie);
extend(UnusedSpacePie, Pie);


EffectiveMemoryPie.prototype.margin = {top: 50, right: 10, left: 10, bottom: 40};

EffectiveMemoryPie.prototype.labels = {
    effective_free_space: 'свободно',
    bad_effective_free_space: 'недоступно',
    downtimed_effective_free_space: 'свободное в даунтайме',
    wasted_effective_free_space: 'свободное в FROZEN|ARCHIVED капле',
    reserved_effective_free_space: 'зарезервировано свободное',
    effective_uncommitted_keys_size: 'незакоммиченно',
    effective_used_space: 'занято',
    effective_removed_keys_size: 'помечено удаленными',
};

EffectiveMemoryPie.prototype.color = d3.scale.ordinal()
    .domain([
        'effective_free_space',
        'bad_effective_free_space',
        'downtimed_effective_free_space',
        'wasted_effective_free_space',
        'reserved_effective_free_space',
        'effective_uncommitted_keys_size',
        'effective_used_space',
        'effective_removed_keys_size',
    ])
    .range([
        'rgb(78,201,106)',
        'rgb(240,72,72)',
        'rgb(68, 136, 255)',
        'rgb(184, 121, 209)',
        'rgb(58, 170, 209)',
        'rgb(224, 210, 122)',
        'rgb(200,200,200)',
        'rgb(97, 99, 232)',
    ]);

EffectiveMemoryPie.prototype.prepareData = Pie.prototype.defaultPrepareData;

EffectiveMemoryPie.prototype.labelLength = 210;
EffectiveMemoryPie.prototype.pieLabelFormatter = prefixBytesRound;
EffectiveMemoryPie.prototype.tooltipFormatter = prefixBytes;
EffectiveMemoryPie.prototype.legendLabelOffset = 10;

LrcEffectiveMemoryPie.prototype.margin = {top: 50, right: 10, left: 10, bottom: 40};

LrcEffectiveMemoryPie.prototype.labels = {
    effective_free_lrc_space: 'свободно',
    bad_effective_free_lrc_space: 'недоступно свободное',
    downtimed_effective_free_lrc_space: 'свободное в даунтайме',
    effective_uncommitted_lrc_keys_size: 'незакоммиченно',
    effective_used_lrc_space: 'закоммиченно',
    effective_removed_lrc_keys_size: 'удалено',
};

LrcEffectiveMemoryPie.prototype.color = d3.scale.ordinal()
    .domain([
        'effective_free_lrc_space',
        'bad_effective_free_lrc_space',
        'downtimed_effective_free_lrc_space',
        'effective_uncommitted_lrc_keys_size',
        'effective_used_lrc_space',
        'effective_removed_lrc_keys_size',
    ])
    .range([
        'rgb(78,201,106)',
        'rgb(240,72,72)',
        'rgb(68, 136, 255)',
        'rgb(224, 210, 122)',
        'rgb(200,200,200)',
        'rgb(97, 99, 232)',
    ]);

LrcEffectiveMemoryPie.prototype.prepareData = Pie.prototype.defaultPrepareData;

LrcEffectiveMemoryPie.prototype.pieLabelFormatter = prefixBytesRound;
LrcEffectiveMemoryPie.prototype.tooltipFormatter = prefixBytes;
LrcEffectiveMemoryPie.prototype.legendLabelOffset = 10;

TotalMemoryPie.prototype.margin = {top: 50, right: 10, left: 10, bottom: 40};

TotalMemoryPie.prototype.labels = {
    free_space: 'свободно',
    bad_free_space: 'недоступное свободное',
    downtimed_free_space: 'свободное в даунтайме',
    uncommitted_keys_size: 'незакоммиченно',
    committed_keys_size: 'закоммиченно',
    removed_keys_size: 'удалено',
    uncoupled_space: 'не используется',
};

TotalMemoryPie.prototype.color = d3.scale.ordinal()
    .domain([
        'free_space',
        'bad_free_space',
        'downtimed_free_space',
        'uncommitted_keys_size',
        'committed_keys_size',
        'removed_keys_size',
        'uncoupled_space',
    ]).range([
        'rgb(78,201,106)',
        'rgb(240,72,72)',
        'rgb(68, 136, 255)',
        'rgb(224, 210, 122)',
        'rgb(200,200,200)',
        'rgb(97, 99, 232)',
        'rgb(246,244,158)',
    ]);

TotalMemoryPie.prototype.prepareData = function(rawdata) {
    var data = [];

    data.push({value: rawdata['free_space'],
               type: 'free_space'});
    data.push({value: rawdata['total_space']
                      - rawdata['free_space']
                      - rawdata['downtimed_free_space']
                      - rawdata['used_space'],
               type: 'bad_free_space'});
    data.push({value: rawdata['downtimed_free_space'],
               type: 'downtimed_free_space'});
    data.push({value: rawdata['uncommitted_keys_size'],
               type: 'uncommitted_keys_size'});
    data.push({value: rawdata['used_space']
                      - rawdata['uncommitted_keys_size']
                      - rawdata['removed_keys_size'],
               type: 'committed_keys_size'});
    data.push({value: rawdata['removed_keys_size'],
               type: 'removed_keys_size'});
    data.push({value: rawdata['uncoupled_space'] ? rawdata['uncoupled_space'] : 0,
               type: 'uncoupled_space'});

    return {data: data};
};

TotalMemoryPie.prototype.pieLabelFormatter = prefixBytesRound;
TotalMemoryPie.prototype.tooltipFormatter = prefixBytes;


LrcMemoryPie.prototype.margin = {top: 50, right: 10, left: 10, bottom: 40};

LrcMemoryPie.prototype.labels = {
    free_lrc_space: 'свободно',
    bad_free_lrc_space: 'недоступное свободное',
    downtimed_free_lrc_space: 'свободное в даунтайме',
    uncommitted_lrc_keys_size: 'незакоммиченно',
    committed_lrc_space: 'закоммиченно',
    removed_lrc_keys_size: 'удалено',
    uncoupled_lrc_space: 'не используется',
    reserved_lrc_space: 'зарезервировано',
};

LrcMemoryPie.prototype.color = d3.scale.ordinal()
    .domain(['free_lrc_space', 'bad_free_lrc_space', 'downtimed_free_lrc_space', 'uncommitted_lrc_keys_size',
            'committed_lrc_space', 'removed_lrc_keys_size', 'uncoupled_lrc_space', 'reserved_lrc_space'])
    .range(['rgb(78,201,106)', 'rgb(240,72,72)', 'rgb(68, 136, 255)', 'rgb(224, 210, 122)',
            'rgb(200,200,200)', 'rgb(97, 99, 232)', 'rgb(246,244,158)', 'rgb(133, 229, 219)']);

LrcMemoryPie.prototype.prepareData = function(rawdata) {
    var data = [];

    data.push({value: rawdata['free_lrc_space'],
               type: 'free_lrc_space'});
    data.push({value: rawdata['total_lrc_space']
            - rawdata['free_lrc_space']
            - rawdata['downtimed_free_lrc_space']
            - rawdata['used_lrc_space'],
               type: 'bad_free_lrc_space'});
    data.push({value: rawdata['downtimed_free_lrc_space'],
               type: 'downtimed_free_lrc_space'});
    data.push({value: rawdata['uncommitted_lrc_keys_size'],
               type: 'uncommitted_lrc_keys_size'});
    data.push({value: rawdata['used_lrc_space']
                      - rawdata['uncommitted_lrc_keys_size']
                      - rawdata['removed_lrc_keys_size'],
               type: 'committed_lrc_space'});
    data.push({value: rawdata['removed_lrc_keys_size'],
               type: 'removed_lrc_keys_size'});
    data.push({value: rawdata['uncoupled_lrc_space'] ? rawdata['uncoupled_lrc_space'] : 0,
               type: 'uncoupled_lrc_space'});
    data.push({value: rawdata['reserved_lrc_space'] ? rawdata['reserved_lrc_space'] : 0,
               type: 'reserved_lrc_space'});

    return {data: data};
};

LrcMemoryPie.prototype.pieLabelFormatter = prefixBytesRound;
LrcMemoryPie.prototype.tooltipFormatter = prefixBytes;


CouplesPie.prototype.margin = {top: 70, right: 10, left: 10, bottom: 40};

CouplesPie.prototype.color = d3.scale.ordinal()
    .domain([
        'open_couples',
        'bad_couples',
        'downtimed_couples',
        'archived_couples',
        'closed_couples',
        'frozen_couples',
        'broken_couples',
        'service_active_couples',
        'service_stalled_couples',
    ]).range([
        'rgb(78,201,106)',
        'rgb(240,72,72)',
        'rgb(68, 136, 255)',
        'rgb(120,120,120)',
        'rgb(200,200,200)',
        'rgb(150,197,255)',
        'rgb(150,35,0)',
        'rgb(220, 110, 220)',
        'rgb(140, 70, 140)',
    ]);

CouplesPie.prototype.labels = {
    open_couples: 'открыто',
    bad_couples: 'недоступно для записи',
    downtimed_couples: 'в даунтайме',
    archived_couples: 'в архиве',
    closed_couples: 'заполнено',
    frozen_couples: 'заморожено',
    broken_couples: 'конфигурация',
    service_active_couples: 'в сервисе',
    service_stalled_couples: 'проблемные в сервисе',
};

CouplesPie.prototype.prepareData = Pie.prototype.defaultPrepareData

UnusedGroupsPie.prototype.margin = {top: 70, right: 10, left: 10, bottom: 40};

UnusedGroupsPie.prototype.color = d3.scale.ordinal()
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

UnusedGroupsPie.prototype.labels = {
    uncoupled_groups: 'для реплики',
    uncoupled_cache_groups: 'для кэша',
    uncoupled_lrc_groups: 'для lrc',
    reserved_lrc_groups: 'зарезервированные для lrc',
    unused_locked_groups: 'заблокированные',
    bad_unused_groups: 'недоступные',
};

UnusedGroupsPie.prototype.labelLength = 160;
UnusedGroupsPie.prototype.prepareData = Pie.prototype.defaultPrepareData;


UnusedSpacePie.prototype.margin = {top: 70, right: 10, left: 10, bottom: 40};

UnusedSpacePie.prototype.color = d3.scale.ordinal()
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

UnusedSpacePie.prototype.labels = {
    uncoupled_space: 'для реплики',
    uncoupled_cached_space: 'для кэша',
    uncoupled_lrc_space: 'для lrc',
    reserved_lrc_space: 'зарезервированные для lrc',
    unused_locked_space: 'заблокированные',
    bad_unused_space: 'недоступные',
    future_backends_space: 'удалённые бэкенды',
};

UnusedSpacePie.prototype.labelLength = 160;
UnusedSpacePie.prototype.prepareData = Pie.prototype.defaultPrepareData;

UnusedSpacePie.prototype.pieLabelFormatter = prefixBytesRound;
UnusedSpacePie.prototype.tooltipFormatter = prefixBytes;

Pie.prototype.update = function (rawdata) {

    var self = this;

    var data = self.prepareData(rawdata);

    self.updateSlices(data.data);
};

Pie.prototype.pieLabelFormatter = function (d) { return d; };
Pie.prototype.tooltipFormatter = function (d) { return d; };
Pie.prototype.legendLabelOffset = 5;
Pie.prototype.defaultMapType = 'couple_status';

Pie.prototype.updateSlices = function (data) {

    var self = this,
        piedata = self.pie(data);

    arcs = self.gpie.selectAll('g.arc')
        .data(piedata)
        .enter()
            .append('g')
            .attr('class', 'arc')
            .style('fill', function (d, i) { return self.color(d.data.type); })
            .style('fill-opacity', 0.6)
            .on('click', function (d) {

                self.hideTooltip();

                PseudoURL.setPath('/map/')
                    .setParam('t', self.defaultMapType)
                    .setParam('filter', d.data.type)
                    .setParam('path', '')
                    .load();
            });
    arcs
        .append('path')
        .attr('d', function () { return self.arc({startAngle: 0, endAngle: 0}); })
        .each(function() { this._current = {startAngle: 0, endAngle: 0}; });
    arcs
        .append('text')
        .attr('class', 'pielabel')
        .attr('fill', 'rgb(120,120,120)')
        .attr('transform', function () { return 'translate(' + self.arc.centroid({startAngle: 0, endAngle: 0}) + ')'; })
        .each(function(d, i) { this._current = {startAngle: 0, endAngle: 0}; });


    arcs.on('mouseenter', function () {

        var data = this.__data__,
            testbarpart = d3.select(this)[0][0];

        self.gpie.selectAll('g.arc').transition()
            .duration(200)
            .style('fill-opacity', function (d) { return (this != testbarpart) ? 0.4 : 0.8 });

        self.tooltip.show(self.margin.top - 10,
                          self.margin.left + (self.height / 2));

        self.tooltip.setSpaceLabel(self.labels[data.data.type] + ': ');
        self.tooltip.setSpaceValue(self.tooltipFormatter(data.data.value));
    }).on('mouseleave', self.hideTooltip.bind(self));

    self.gpie.selectAll('g.arc path')
        .data(piedata)
        .transition()
        .duration(750)
        .attrTween('d', self.arcTween(self));

    self.gpie.selectAll('g.arc text')
        .data(piedata)
        .transition()
        .duration(750)
        .text(function (d) { return (d.endAngle - d.startAngle > Math.PI/4) ? self.pieLabelFormatter(d.data.value) : ''; })
        .attrTween('transform', self.arcLabelTween(self));
};

Pie.prototype.hideTooltip = function () {

    var self = this;

    self.gpie.selectAll('g.arc').transition()
        .duration(200)
        .style('fill-opacity', 0.6);

    self.tooltip.hide();
};

Pie.prototype.legend_per_line = 2;
Pie.prototype.labelLength = 150;
Pie.prototype.addLegend = function () {

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
                .attr('transform', 'translate(' + (i * self.labelLength) + ',' + (self.legendLabelOffset + (j * 15)) + ')')
                .style('fill', cl[0]);

            self.legend
                .append('text')
                .attr('class', 'legend-label')
                .attr('transform', 'translate(' + (i * self.labelLength + 15) + ',' + (self.legendLabelOffset + (j * 15)) + ')')
                .attr('y', 4)
                .text('— ' + self.labels[cl[1]]);
        });
    });

    if (self.width - self.legend[0][0].getBBox().width > 0) {
        self.legend
            .attr('transform', 'translate(' + (self.width - self.legend[0][0].getBBox().width) + ',0)');
    }
    self.margin.top = d3.max([self.margin.top, self.legend[0][0].getBBox().height + 20]);
};

Pie.prototype.arcTween = function (self) {
    return function (a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
            return self.arc(i(t));
        };
    }
}

Pie.prototype.arcLabelTween = function (self) {
    return function (a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
            var curd = i(t),
                cangle = curd.startAngle + (curd.endAngle - curd.startAngle) / 2,
                textangle = (cangle < Math.PI) ?
                    cangle - Math.PI/2 :
                    cangle - 3 * Math.PI/2;
            return 'translate(' + self.labelArc.centroid(curd) + ')' +
                   'rotate(' + Math.round(textangle / Math.PI * 180) + ')';
        };
    }
}
