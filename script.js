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
var token;
const interval = 10000;

const US_ID = "c365b1ae-18eb-4e1f-bf75-6bf5479194a9";
const US_type = "DISTANCE";
const US_queue = new Queue();
const US_max = 700;
const US_min = 0;

const IMU_ID = "d1a95566-0f31-4093-a821-872e6735765a";
const IMU_type = "ACCELERATION";
const IMU_queue = new Queue();
// const IMU_max;
// const IMU_min;

// Functions
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
            var text = document.getElementById("info").querySelector("p");
            text.innerHTML = "Please go to this <a href='https://cors-anywhere.herokuapp.com/' target='_blank'>site</a> and click the button for temporary access.\nRefresh this website afterwards.";
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

function fetchData() {
    // Parameters initialize
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
        if (data.Count != 0) {
            // Get current average value
            var value_total = 0;
            for (let i = 0; i < data.Count; i++) {
                value_total += data.Items[i].value;
            }
            const cur_value = value_total / data.Count;
            // Update .bar_fill
            const us = document.getElementById("us");
            const bar_fill = us.querySelector(".cur_data").querySelector(".bar").querySelector(".bar_fill");
            US_ratio = (cur_value - US_min) / (US_max - US_min);
            bar_fill.style.width = US_ratio * 100 + "%";
            bar_fill.style.backgroundColor = fillColor(US_ratio);
            // Update .array
            if (US_queue.isFull()) {
                US_queue.dequeue();
            }
            US_queue.enqueue(cur_value);
            for (let i = 0; i < US_queue.length(); i++) {
                const child = document.getElementById(`child_us${i + 1}`);
                child.innerHTML = US_queue.get(i);
                var ratio = (US_queue.get(i) - US_min) / (US_max - US_min);
                child.style.backgroundColor = fillColor(ratio);
            }
        }
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
        if (data.Count != 0) {
            // Get current average value
            var value_total = 0;
            for (let i = 0; i < data.Count; i++) {
                value_total += data.Items[i].value;
            }
            const cur_value = value_total / data.Count;
            // Update .bar_fill
            const imu = document.getElementById("imu");
            const bar_fill = imu.querySelector(".cur_data").querySelector(".bar").querySelector(".bar_fill");
            IMU_ratio = (cur_value - IMU_min) / (IMU_max - IMU_min);
            bar_fill.style.width = IMU_ratio * 100 + "%";
            bar_fill.style.backgroundColor = fillColor(ratio);
            // Update .array
            if (IMU_queue.isFull()) {
                IMU_queue.dequeue();
            }
            IMU_queue.enqueue(cur_value);
            for (let i = 0; i < IMU_queue.length(); i++) {
                var child = document.getElementById(`child_imu${i + 1}`);
                child.innerHTML = IMU_queue.get(i);
                var ratio = (IMU_queue.get(i) - IMU_min) / (IMU_max - IMU_min);
                child.style.backgroundColor = fillColor(ratio);
            }
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });

    // Determine whether it's good to go.
    Promise.all([fetch_US, fetch_IMU])
    .then(() => {
        var text = document.getElementById("info").querySelector("p");
        if (US_ratio <= 0.4 && IMU_ratio <= 0.4) {
            text.innerHTML = "推薦前往小吃部: 推薦";
        } else if (US_ratio <= 0.7 && IMU_ratio <= 0.7) {
            text.innerHTML = "推薦前往小吃部: 普通";
        } else {
            text.innerHTML = "推薦前往小吃部: 不推薦";
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function initialize() {
    login();
    setInterval(fetchData, interval);
}

document.addEventListener("DOMContentLoaded", initialize());

// TODO:
// Store data in external files.
// Have data already on the history data.