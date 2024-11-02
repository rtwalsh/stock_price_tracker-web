/*
 *  Stock Price Tracker
 *
 *  Author: Robert Walsh
 *  Date:   November 2, 2024
 * 
 */

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
}
