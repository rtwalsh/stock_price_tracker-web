/*
 *  Stock Price Tracker
 *
 *  Author: Robert Walsh
 *  Date:   November 2, 2024
 * 
 */

const API_KEY = "taNeJ_Xfh4Fo_nR2VI5OvX0R_J3w3Rd6";
const URL_TEMPLATE = "https://api.polygon.io/v2/aggs/ticker/{symbol}/range/{interval}/{unit}/{from_date}/{to_date}?limit={limit}&apiKey={API_KEY}";
const QUERY_LIMIT = 5000;
const RANGE_BUFFER = 10;
const GRAPH_MARGIN = 25;

/*
 *  GRAPH OBJECT DEFINITION
 */
let canvas = document.getElementById("results_graph");
let graph = {
    height: canvas.height,
    width: canvas.width,
    xMargin: GRAPH_MARGIN,
    yMargin: GRAPH_MARGIN,
    context: canvas.getContext("2d"),
    erase: function() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.font = "10px arial";
        this.context.textBaseline = "middle";
        this.labelCount = 0;
    },
    setDomain: function(domain) {
        this.domain = domain;
    },
    setRange: function(lowerLimit, upperLimit) {
        this.lowerLimit = lowerLimit;
        this.upperLimit = upperLimit;
    },
    yFromRangeY: function(rangeY) {
        let yAxisHeight = this.height - 2 * this.yMargin;
        return this.height - this.yMargin - (yAxisHeight * this.scaleToRange(rangeY));
    },
    scaleToRange: function(rangeY) {
        return (rangeY - this.lowerLimit) / (this.upperLimit - this.lowerLimit);
    },
    xFromDomainX: function(domainX) {
        let xAxisLength = this.width - 2 * this.xMargin;
        return this.xMargin + (xAxisLength * domainX / this.domain);
    },
    drawAxes: function() {
        this.context.beginPath();
        this.context.strokeStyle = "black";
        this.context.moveTo(this.xMargin, this.yMargin);
        this.context.lineTo(this.xMargin, this.height - this.yMargin);
        this.context.lineTo(this.width - this.xMargin, this.height - this.yMargin);
        this.context.stroke();

        if (this.domain && this.lowerLimit && this.upperLimit) {
            this.context.fillStyle = "black";
            this.context.fillText(this.lowerLimit, 5, this.yFromRangeY(this.lowerLimit));
            this.context.fillText(this.upperLimit, 5, this.yFromRangeY(this.upperLimit));
        }
    },
    plot: function(label, color, dataPoints, property) {
        // Add an entry to the legend
        this.context.fillStyle = color;
        this.context.fillText(label, this.xFromDomainX(0.25), this.yMargin + 15 * this.labelCount++);

        // Plot the points in the data set
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.moveTo(this.xFromDomainX(0), this.yFromRangeY(dataPoints[0][property]));
        for (let x = 1; x < this.domain; ++x) {
            this.context.lineTo(this.xFromDomainX(x), this.yFromRangeY(dataPoints[x][property]));
        }
        this.context.stroke();
    }
};

function initialize() {
    let today = new Date();
    let firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);

    document.getElementById("from_date_field").value = formatDate(firstDayOfMonth);
    document.getElementById("to_date_field").value = formatDate(today);
}

function formatDate(date) {
    let result = date.toISOString();
    console.log(result);

    let t = result.indexOf("T");
    return result.substring(0, t);
}

function setSubmitButtonState(event) {
    document.getElementById("submit_button").disabled = !event.currentTarget.value.length;
}

function submitForm(event) {
    event.preventDefault();
    console.log("Form submitted");

    document.getElementById("error_section").hidden = true;
    document.getElementById("results_section").hidden = true;

    let queryParameters = getQueryParameters();
    let url = constructUrl(queryParameters);
    sendRequest(url);
}

function getQueryParameters() {
    let queryParameters = {};
    queryParameters.symbol = document.getElementById("stock_symbol_field").value.toUpperCase();
    queryParameters.fromDate = new Date(document.getElementById("from_date_field").value);
    queryParameters.toDate = new Date(document.getElementById("to_date_field").value);
    queryParameters.interval = parseInterval(document.getElementById("pricing_interval").value);
    console.log(queryParameters);
    return queryParameters;
}

function parseInterval(interval) {
    if (interval === "half_hour") {
        return { qty: 30, unit: "minute" };
    }
    return { qty: 1, unit: interval };
}

function constructUrl(queryParameters) {
    let url = URL_TEMPLATE;
    url = url.replace("{symbol}", queryParameters.symbol);
    url = url.replace("{interval}", queryParameters.interval.qty);
    url = url.replace("{unit}", queryParameters.interval.unit);
    url = url.replace("{from_date}", formatDate(queryParameters.fromDate));
    url = url.replace("{to_date}", formatDate(queryParameters.toDate));
    url = url.replace("{limit}", QUERY_LIMIT);
    url = url.replace("{API_KEY}", API_KEY);
    console.log(url);
    return url;
}

function sendRequest(url) {
    let request = new XMLHttpRequest();
    request.open("GET", url);
    request.onload = function() {
        if ((this.status >= 200) && (this.status < 400)) {
            console.log("Received: " + this.responseText);
            processResponse(this.responseText);
        } else {
            displayError("Request failed.  Response status code: " + this.status);
        }
    };
    request.send();
}

function processResponse(response) {
    let data = JSON.parse(response);
    console.log(data);

    if (data.resultsCount > 0) {
        document.getElementById("stock_symbol_span").textContent = data.ticker;
        document.getElementById("from_date_span").textContent = new Date(data.results[0].t).toDateString();
        document.getElementById("to_date_span").textContent = new Date(data.results[data.resultsCount - 1].t).toDateString();
    
        let aggregates = analyze(data);
        document.getElementById("starting_price_cell").textContent = data.results[0].o;
        document.getElementById("ending_price_cell").textContent = data.results[data.resultsCount - 1].c;
        document.getElementById("average_low_cell").textContent = aggregates.avgLow;
        document.getElementById("average_high_cell").textContent = aggregates.avgHigh;
        document.getElementById("average_open_cell").textContent = aggregates.avgOpen;
        document.getElementById("average_close_cell").textContent = aggregates.avgClose;
        document.getElementById("min_low_cell").textContent = aggregates.minLow;
        document.getElementById("max_high_cell").textContent = aggregates.maxHigh;
    
        drawGraph(aggregates, data);
    
        document.getElementById("results_section").hidden = false;
    } else {
        displayError("No data returned for: " + data.ticker);
    }
}

function analyze(data) {
    let lowSum = 0;
    let highSum = 0;
    let openSum = 0;
    let closeSum = 0;
    let minLow = -1;
    let maxHigh = 0;

    for (let x = 0; x < data.resultsCount; ++x) {
        let dataPoint = data.results[x];
        lowSum += dataPoint.l;  // lowercase 'L', not '1'
        highSum += dataPoint.h;
        openSum += dataPoint.o; // lowercase 'O', not '0'
        closeSum += dataPoint.c;

        if ( (minLow < 0) || (dataPoint.l < minLow) ) {
            minLow = dataPoint.l;
        }

        if (dataPoint.h > maxHigh) {
            maxHigh = dataPoint.h;
        }
    }

    return {
        avgLow: lowSum / data.resultsCount,
        avgHigh: highSum / data.resultsCount,
        avgOpen: openSum / data.resultsCount,
        avgClose: closeSum / data.resultsCount,
        minLow: minLow,
        maxHigh: maxHigh
    };
}

function drawGraph(aggregates, data) {
    graph.erase();
    graph.setDomain(data.resultsCount);
    graph.setRange(Math.floor(aggregates.minLow) - RANGE_BUFFER, Math.ceil(aggregates.maxHigh) + RANGE_BUFFER);
    graph.drawAxes();
    graph.plot("High", "purple", data.results, "h");
    graph.plot("Low", "blue", data.results, "l"); // this is lowercase 'L'
    graph.plot("Open", "green", data.results, "o"); // this is lowercase 'O'
    graph.plot("Close", "red", data.results, "c");
}

function displayError(errMsg) {
    console.warn(errMsg);
    let element = document.getElementById("error_section");
    element.textContent = errMsg;
    element.hidden = false;
}