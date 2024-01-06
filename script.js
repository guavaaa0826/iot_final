// Class declaration
class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(element) {
        this.items.push(element);
    }
    dequeue() {
        if (this.isEmpty()) {
            throw new Error("Error: queue is empty.");
        }
        return this.items.shift();
    }
    get(idx) {
        return this.items[idx];
    }

    isEmpty() {
        return this.items.length === 0;
    }
    isFull() {
        return this.items.length === 10;
    }
    length() {
        return this.items.length;
    }
}

// Variables
const proxyUrl = "https://cors-anywhere.herokuapp.com/"; // We use CORS proxy server to avoid the Access-Control-Allow-Origin issue.
const interval = 15000;
var website_enable = false; // False if 403, true if 200.
var token;

const US_ID = "c365b1ae-18eb-4e1f-bf75-6bf5479194a9";
const US_type = "DISTANCE";
const US_queue = new Queue();
const US_threshold = 150;

const IMU_ID = "d1a95566-0f31-4093-a821-872e6735765a";
const IMU_type = "ACCELERATION";
const IMU_queue = new Queue();
const IMU_threshold = 1.02;

// Functions
// Return the color according to the ratio.
function fillColor(ratio) {
    var color;
    if (ratio <= 0.4) {
        color = "lightgreen";
    } else if (ratio <= 0.7) {
        color = "yellow";
    } else {
        color = "red";
    }
    return color;
}

function fillArray() {
    // Show the data on the array
    for (let i = 0; i < US_queue.length(); i++) {
        const child = document.getElementById(`child_us${i + 1}`);
        const percentage = (US_queue.get(i) * 100).toFixed(0);
        child.innerHTML = `${percentage}%`;
        child.style.backgroundColor = fillColor(US_queue.get(i));
    }
    for (let i = 0; i < IMU_queue.length(); i++) {
        var child = document.getElementById(`child_imu${i + 1}`);
        const percentage = (IMU_queue.get(i) * 100).toFixed(0);
        child.innerHTML = `${percentage}%`;
        child.style.backgroundColor = fillColor(IMU_queue.get(i));
    }
}

// Login to the samrt campus and get the token.
function login() {
    console.log("Enter login().")
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
            var text = document.getElementById("info").querySelector("p");
            text.innerHTML = "請到<a href='https://cors-anywhere.herokuapp.com/' target='_blank'>這裡</a>並點擊該網站的按鍵並刷新網頁。";
            text.style.fontSize = "20px";
            throw new Error(`HTTP error status: ${response.status}.`);
        } else {
            var text = document.getElementById("info").querySelector("p");
            text.innerHTML = "請等待網頁獲取歷史資料。";
            text.style.fontSize = "30px";
            website_enable = true;
        }
        return response.json();
    })
    .then(data => {
        token = data.token;
        console.log(`Token get: ${token}.`);
    })
    .then(() => {
        getPastData();
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

// Fetching pass data
function getPastData() {
    if (website_enable == false) {
        return;
    }
    // Parameters initialize
    var currentTimestamp = new Date().getTime();
    const header = {
        'Content-Type': 'application/json',
        'token': token,
    };
    const HTTPHeader = new Headers(Object.entries(header));

    // Fetching pass data
    for (let i = -10; i < 0; i++) {
        console.log(`Fetching past data ${i}.`)
        var lastTimestampStart = currentTimestamp + interval * i;
        var lastTimestampEnd = currentTimestamp + interval * (i + 1);
        const targetUrl_US = `https://smart-campus.kits.tw/api/api/sensors_in_timeinterval/${US_type}/${US_ID}/${lastTimestampStart}/${lastTimestampEnd}`;
        const apiUrl_US = proxyUrl + targetUrl_US;
        const targetUrl_IMU = `https://smart-campus.kits.tw/api/api/sensors_in_timeinterval/${IMU_type}/${IMU_ID}/${lastTimestampStart}/${lastTimestampEnd}`;
        const apiUrl_IMU = proxyUrl + targetUrl_IMU;

        // Start fetching US data
        fetch(apiUrl_US, {
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
            if (data.Count != 0) {
                // Get current average value
                var value_total = 0;
                for (let i = 0; i < data.Count; i++) {
                    value_total += (data.Items[i].value <= US_threshold) ? 1 : 0;
                }
                // Update .array
                var US_ratio = value_total / data.Count;
                US_queue.enqueue(US_ratio);
            } else {
                US_queue.enqueue(0);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });

        // Start fetching IMU data
        fetch(apiUrl_IMU, {
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
            if (data.Count != 0) {
                // Get current average value
                var value_total = 0;
                for (let i = 0; i < data.Count; i++) {
                    value_total += (data.Items[i].value <= US_threshold) ? 1 : 0;
                }
                // Update .array
                var IMU_ratio = value_total / data.Count;
                IMU_queue.enqueue(IMU_ratio);
            } else {
                IMU_queue.enqueue(0);
            }
        })
        .then(() => {
            if (i == -1) {
                fillArray();
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }
}

// Fetch the data of US and IMU.
function fetchData() {
    if (website_enable == false) {
        return;
    }
    console.log("Executing fetchData().")
    
    var US_ratio = 0;
    var IMU_ratio = 0;
    var currentTimestamp = new Date().getTime();
    var lastTimestamp = currentTimestamp - interval;
    const targetUrl_US = `https://smart-campus.kits.tw/api/api/sensors_in_timeinterval/${US_type}/${US_ID}/${lastTimestamp}/${currentTimestamp}`;
    const apiUrl_US = proxyUrl + targetUrl_US;
    const targetUrl_IMU = `https://smart-campus.kits.tw/api/api/sensors_in_timeinterval/${IMU_type}/${IMU_ID}/${lastTimestamp}/${currentTimestamp}`;
    const apiUrl_IMU = proxyUrl + targetUrl_IMU;
    const header = {
        'Content-Type': 'application/json',
        'token': token,
    };
    const HTTPHeader = new Headers(Object.entries(header));

    // Start fetching US data
    const fetch_US = fetch(apiUrl_US, {
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
        var value_total = 0;
        if (data.Count != 0) {
            // Get current average value
            for (let i = 0; i < data.Count; i++) {
                value_total += (data.Items[i].value <= US_threshold) ? 1 : 0;
            }
            US_ratio = value_total / data.Count;
        } else {
            US_ratio = 0;
        }
        // Update .bar_fill
        const us = document.getElementById("us");
        const bar_fill = us.querySelector(".cur_data").querySelector(".bar").querySelector(".bar_fill");
        bar_fill.style.width = US_ratio * 100 + "%";
        bar_fill.style.backgroundColor = fillColor(US_ratio);
        // Update .array
        if (US_queue.isFull()) {
            US_queue.dequeue();
        }
        US_queue.enqueue(US_ratio);
    })
    .catch(error => {
        console.error("Error:", error);
    });

    // Start fetching IMU data
    const fetch_IMU = fetch(apiUrl_IMU, {
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
        var value_total = 0;
        if (data.Count != 0) {
            // Get current average value
            for (let i = 0; i < data.Count; i++) {
                value_total += (data.Items[i].value <= US_threshold) ? 1 : 0;
            }
            IMU_ratio = value_total / data.Count;
        } else {
            IMU_ratio = 0;
        }
        // Update .bar_fill
        const imu = document.getElementById("imu");
        const bar_fill = imu.querySelector(".cur_data").querySelector(".bar").querySelector(".bar_fill");
        bar_fill.style.width = IMU_ratio * 100 + "%";
        bar_fill.style.backgroundColor = fillColor(IMU_ratio);
        // Update .array
        if (IMU_queue.isFull()) {
            IMU_queue.dequeue();
        }
        IMU_queue.enqueue(IMU_ratio);
    })
    .catch(error => {
        console.error("Error:", error);
    });

    // Determine how many people are there.
    Promise.all([fetch_US, fetch_IMU])
    .then(() => {
        var text = document.getElementById("info").querySelector("p");
        if (US_ratio <= 0.4 && IMU_ratio <= 0.4) {
            text.innerHTML = "小吃部人流: 少";
        } else if (US_ratio <= 0.7 && IMU_ratio <= 0.7) {
            text.innerHTML = "小吃部人流: 普通";
        } else {
            text.innerHTML = "小吃部人流: 多";
        }
        fillArray();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function initialize() {
    login();
    setInterval(fetchData, interval);
}

document.addEventListener("DOMContentLoaded", initialize);

// TODO:
// 1. Determine the threshold value of US and IMU.
// 2. Change the font of the hint texts in login().
