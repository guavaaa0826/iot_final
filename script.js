class Queue {
    constructor() { this.items = []; }

    enqueue(element) { this.items.push(element); }

    dequeue() {
        if (this.isEmpty()) { return null; }
        return this.items.shift();
    }

    front() {
        if (this.isEmpty()) { return null; }
        return this.items[0];
    }

    isEmpty() { return this.items.length === 0; }

    size() { return this.items.length; }
}

// Variables
// We use CORS proxy server to avoid the Access-Control-Allow-Origin issue.
const proxyUrl = "https://cors-anywhere.herokuapp.com/";
var token;
const interval = 60000;

const US_ID = "c365b1ae-18eb-4e1f-bf75-6bf5479194a9";
const US_type = "DISTANCE";
const US_queue = new Queue();
var IMU_ID;
var IMU_type;
const IMU_queue = new Queue();

// Functions
function login() {
    const targetUrl = "https://smart-campus.kits.tw/api/api/account/login";
    const apiUrl = proxyUrl + targetUrl;

    fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: "bachelor_01",
            password: "bachelor_01"
        })
    })
    .then(response => {
        if (!response.ok) {
            var info = document.getElementById("info");
            var text = info.querySelector("p");
            text.innerHTML = "Please go to this <a href='https://cors-anywhere.herokuapp.com/' target='_blank'>site</a> and click the button for temporary access.\nPlease refresh this website afterwards.";
            throw new Error(`HTTP error status: ${response.status}.`);
        }

        return response.json();
    })
    .then(data => {
        token = data.token;
        console.log(`Token get: ${token}.`);
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function fetchDataUS() {
    var currentTimestamp = new Date().getTime();
    var lastTimestamp = currentTimestamp - interval;
    const targetUrl = `https://smart-campus.kits.tw/api/api/sensors_in_timeinterval/${US_type}/${US_ID}/${lastTimestamp}/${currentTimestamp}`;
    const apiUrl = proxyUrl + targetUrl;

    const header = {
        'Content-Type': 'application/json',
        'token': token,
    };
    const HTTPHeader = new Headers(Object.entries(header));

    fetch(apiUrl, {
        method: "GET",
        headers: HTTPHeader
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error status: ${response.status}.`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function fetchDataIMU() {

}

function initialize() {
    login();
    setInterval(fetchDataUS, interval);
    setInterval(fetchDataIMU, interval);
}

document.addEventListener("DOMContentLoaded", initialize());

// TODO:
// 1. Choose fonts from https://fonts.google.com/
// 2. Store data in external files.
// 3. Finish designing UI.