//Data Tools
//把標示為空值的字串("NA")變成JavaScript認知的空值
const parseNA = string => (string == 'NA' ? undefined : string);
const parseDate = string => d3.timeParse('%Y-%m-%d')(string);
function type(d){
    const date = parseDate(d.release_date);
    return {
        eps:+d.EPS, // + 號會直接將字串轉成為數字
        genre:parseNA(d.genre),
        companyCode:+d.companyCode,
        sales:+d.sales,
        date:+d.date,
        companyName:parseNA(d.companyName),
        revenue:+d.revenue,
        shareValue:+d.shareValue,
        netIncome:+d.netIncome,
        comprehensiveIcome:+d.comprehensiveIcome,
        IncomeAfterTax:+d.IncomeAfterTax,
        grossProfitMargin:+d.netIncome/d.revenue/100000000,
    }
}

function formatTicks(d){
    return d3.format('~s')(d)
    .replace('M','mil')
    .replace('G','bil')
    .replace('T','tri')
}
//Data Selection 會選擇輸入的產業類別
function filterData(data){
    return data.filter(
        d => {
            return(
                d.companyName && d.revenue>0 && d.netIncome>0 && d.genre === catagories

            );
        }
    );
}

function prepareBarChartData(data){
    console.log(data);
    const dataMap= d3.rollup(
        data,
        v => d3.sum(v, leaf => leaf.eps), //將revenue加總
        d => d.companyName //依電影分類groupby
    );
    const dataArray = Array.from(dataMap, d=>({companyName:d[0], eps:d[1]}));
    return dataArray;
}

function setupCanvas(barChartData, companyClean){

    let metric = '';

    function click(){
        // debugger;
        metric = this.dataset.name;
        const thisData = chooseData(metric, companyClean);
        update(thisData);

    }

    
    d3.select('.controls').selectAll('button').on('click',click);

    // d3.select('.catagory').selectAll('button').on('click',()=>{
    //     console.log('clicked');
    //     filterSemiConductor(companyClean);
    //     console.log(companyClean);
    //     update(companyClean);
    // });

    function update(data){
        console.log(data);
        //Update Scale
        xMax = d3.max(data, d=>d[metric]);
        xScale_v3 = d3.scaleLinear([0, xMax],[0, barchart_width]);

        yScale = d3.scaleBand().domain(data.map(d=>d.companyName))
        .rangeRound([0, barchart_height]).paddingInner(0);

        //Transition Settings
        const defaultDelay = 1000;
        const transitionDelay = d3.transition().duration(defaultDelay);

        //Update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        //Update Header
        header.select('tspan').text(`前20名公司 ${metric} 數據 ${metric === 'grossProfitMargin'  ? '' : 'in $TWD'}  產業類:${catagories}`);

        //Update Bar
        bars.selectAll('.bar').data(data, d=>d.companyName).join(
            enter => {
                enter.append('rect').attr('class', 'bar')
                .attr('x',0).attr('y',d=>yScale(d.companyName))
                // .attr('height',yScale.bandwidth()/1.5)
                .attr('height', 16)
                .style('fill','lightcyan')
                .transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('width',d=>xScale_v3(d[metric]))
                .style('fill','dodgerblue');
            },
            update => {
                update.transition(transitionDelay)
                .delay((d,i)=>i*20)
                .attr('y',d=>yScale(d.companyName))
                .attr('width',d=>xScale_v3(d[metric]))
                .style('fill','dodgerblue');
            },
            exit => {
                exit.transition().duration(defaultDelay/2)
                .style('fill-opacity',0)
                .remove();
            }
        );

        //add event listenser
        d3.selectAll('.bar')
            .on('mouseover',mouseover)
            .on('mousemove',mousemove)
            .on('mouseout',mouseout);
    }
    const svg_width = 800;
    const svg_height = 600;
    const barchart_margin = {top:80, right:40, bottom:40,left:250};
    const barchart_width = svg_width - (barchart_margin.left + barchart_margin.right);
    const barchart_height = svg_height - (barchart_margin.top + barchart_margin.bottom);

    const this_svg = d3.select('.bar-chart-container').append('svg')
    .attr('width', svg_width).attr('height', svg_height).append('g')
        .attr('transform', `translate(${barchart_margin.left}, ${barchart_margin.top})`);
    // .attr('transform', 'translate('+chart_margin.left+','+chart_margin.top+')');

    //scale
    // d3.extent -> find min & max
    const xExtent = d3.extent(barChartData, d=> d.revenue);
    // debugger;
    //v1 (min, max)
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, barchart_width]);
    //v2 (0, max)
    let xMax = d3.max(barChartData, d=> d.revenue);
    let xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0, barchart_width]);
    //v3 short writing for v2
    let xScale_v3 = d3.scaleLinear([0,xMax], [0, barchart_width]);
    
    //y
    let yScale = d3.scaleBand().domain(barChartData.map(d=>d.title))
        .rangeRound([0,barchart_height])
                                 .paddingInner(0.1);
    //Draw bars
    // const bars = this_svg.selectAll('.bar').data(barChartData).enter()
    //              .append('rect').attr('class', 'bar')
    //              .attr('x',0).attr('y', d=>yScale(d.genre))
    //              .attr('width', d=>xScale_v3(d.revenue))
    //              .attr('height', yScale.bandwidth())
    //              .style('fill', 'dodgerblue');

    const bars = this_svg.append('g').attr('class', 'bars');

    //Draw Header
    let header = this_svg.append('g').attr('class','bar-header')
                   .attr('transform',`translate(0,${-barchart_margin.top/2})`)
                   .append('text');
    // header.append('tspan').text('Total revenue by genre in $US');
    header.append('tspan').text(catagories);
    header.append('tspan').text("111 第3季")
          .attr('x',0).attr('y',20).style('font-size','0.8em').style('fill','#555');

    //Draw X axis & Y axis
    let xAxis = d3.axisTop(xScale_v3).tickFormat(formatTicks)
                    .tickSizeInner(-barchart_height)
                    .tickSizeOuter(1);

    // const xAxisDraw = this_svg.append('g').attr('class','x axis').call(xAxis);
    let xAxisDraw = this_svg.append('g').attr('class', 'x axis');

    //tickSize : set tickSizeInner & tickSizeOuter at the same time with the same value
    let yAxis = d3.axisLeft(yScale).tickSize(0);

    // const yAxisDraw = this_svg.append('g').attr('class','y axis').call(yAxis);
    let yAxisDraw = this_svg.append('g').attr('class', 'y axis');
    yAxisDraw.selectAll('text').attr('dx','-0.6em');
    
    update(barChartData);

    //interactive
    const tip = d3.select('.tooltip');
    //e -> event
    function mouseover(e){
        // debugger;
        const thisBarData = d3.select(this).data()[0];
        // debugger;
        const bodyData = [
            ['營業收入', thisBarData.revenue],
            ['營業利益', thisBarData.netIncome],
            ['每股盈餘', thisBarData.eps],
            ['營業外收入及支出', thisBarData.comprehensiveIcome],
            ['稅後淨利', thisBarData.IncomeAfterTax],
            ['毛利率', Math.round(thisBarData.netIncome / thisBarData.revenue*1000)/1000],
            // ['TMDB Popularity', Math.round(thisBarData.popularity)],
            // ['IMDB Rating', thisBarData.vote_average],
            // ['Genres', thisBarData.genres.join(', ')]
        ];

        // debugger;
        tip.style('left',(e.clientX+15)+'px')
           .style('top',e.clientY+'px')
           .transition()
           .style('opacity',0.98);
        
        //show this data
        tip.select('h3').html(`${thisBarData.companyName}, ${thisBarData.companyCode}`);
        tip.select('h4').html(` ${thisBarData.genre}`);

        d3.select('.tip-body').selectAll('p').data(bodyData)
          .join('p').attr('class', 'tip-info').html(d => `${d[0]} : ${d[1]}`);

    }

    function mousemove(e){
        const thisBarData = d3.select(this).data()[0];

        tip.style('left',(e.clientX+15)+'px')
            .style('top',e.clientY+'px')
            .style('opacity',0.98)
        
            tip.select('h3').html(`${thisBarData.companyName}, ${thisBarData.companyCode}`);
            tip.select('h4').html(` ${thisBarData.genre}`);
    }

    function mouseout(e) {
        tip.transition()
        .style('opacity', 0);
    }

    d3.selectAll('.bar')
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mousemover', mouseout);
}

//Main
var catagories = "其他";
function ready(companies){
    var button = document.querySelector('.prompttest');
    var showtxt = document.querySelector('.show');
    function popup3(e) {
        var typeCatgory = window.prompt('請輸入欲查詢產業類別');
        if (typeCatgory == null || "") {
            showtxt.innerHTML = '您已取消輸入'
        } else {
            catagories = typeCatgory;
            showtxt.innerHTML = '目前查詢的產業類別為: ' + typeCatgory;
        }
        const companyClean = filterData(companies);
        setupCanvas(companyClean, companyClean);
    }
    button.addEventListener('click', popup3);
}

d3.csv('data/epsData.csv', type).then(
    res => {
        // console.log('CSV:',res[0]);
        ready(res);
        // debugger;
    }
);

function chooseData(metric, companyClean){
    const thisData = companyClean.sort((a,b)=>b[metric]-a[metric]).filter((d,i)=>i<20);
    return thisData;
}
