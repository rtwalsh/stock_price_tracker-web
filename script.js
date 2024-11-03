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
        } else {
            let errMsg = "Request failed.  Response status code: " + this.status;
            console.warn(errMsg);
        }
    };
    request.send();
}
