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
var website_enable = false; // False if 403, true if 200.

const US_ID = "c365b1ae-18eb-4e1f-bf75-6bf5479194a9";
const US_type = "DISTANCE";
const US_queue = new Queue();
const US_threshold = 50;

const IMU_ID = "d1a95566-0f31-4093-a821-872e6735765a";
const IMU_type = "ACCELERATION";
const IMU_queue = new Queue();
// const IMU_threshold;

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
        } else {
            website_enable = true;
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

function initialize() {
    if (website_enable == false) {
        return;
    }
    var currentTimestamp = new Date().getTime();
    const header = {
        'Content-Type': 'application/json',
        'token': token,
    };
    const fetching = () => {
        for (let i = 0; i < 10; i++) {
            var prevStartTimestamp = currentTimestamp + (i - 10) * interval;
            var prevEndTimstamp = currentTimestamp + (i - 9) * interval;
            const targetUrl_US = `https://smart-campus.kits.tw/api/api/sensors_in_timeinterval/${US_type}/${US_ID}/${prevStartTimestamp}/${prevEndTimstamp}`;
            const apiUrl_US = proxyUrl + targetUrl_US;
            const targetUrl_IMU = `https://smart-campus.kits.tw/api/api/sensors_in_timeinterval/${IMU_type}/${IMU_ID}/${prevStartTimestamp}/${prevEndTimestamp}`;
            const apiUrl_IMU = proxyUrl + targetUrl_IMU;

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
                    US_queue.enqueue(value_total / data.Count);
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
                    IMU_queue.enqueue(IMU_ratio);
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
        }
    }
    Promise.all([fetching])
    .then(() => {
        for (let i = 0; i < US_queue.length; i++) {
            const child = document.getElementById(`child_us${i + 1}`);
            const percentage = (US_queue.get(i) * 100).toFixed(0);
            child.innerHTML = `${percentage}%`;
            child.style.backgroundColor = fillColor(US_queue.get(i));
        }
        for (let i = 0; i < IMU_queue.length; i++) {
            const child = document.getElementById(`child_imu${i + 1}`);
            const percentage = (IMU_queue.get(i) * 100).toFixed(0);
            child.innerHTML = `${percentage}%`;
            child.style.backgroundColor = fillColor(IMU_queue.get(i));
        }
    }).catch(error => {
        console.error("Error:", error);
    });
}

function fetchData() {
    if (website_enable == false) {
        return;
    }
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
                value_total += (data.Items[i].value <= US_threshold) ? 1 : 0;
            }
            // Update .bar_fill
            const us = document.getElementById("us");
            const bar_fill = us.querySelector(".cur_data").querySelector(".bar").querySelector(".bar_fill");
            US_ratio = value_total / data.Count;
            bar_fill.style.width = US_ratio * 100 + "%";
            bar_fill.style.backgroundColor = fillColor(US_ratio);
            // Update .array
            if (US_queue.isFull()) {
                US_queue.dequeue();
            }
            US_queue.enqueue(US_ratio);
            for (let i = 0; i < US_queue.length(); i++) {
                const child = document.getElementById(`child_us${i + 1}`);
                const percentage = (US_queue.get(i) * 100).toFixed(0);
                child.innerHTML = `${percentage}%`;
                child.style.backgroundColor = fillColor(US_queue.get(i));
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
                value_total += (data.Items[i].value <= US_threshold) ? 1 : 0;
            }
            // Update .bar_fill
            const imu = document.getElementById("imu");
            const bar_fill = imu.querySelector(".cur_data").querySelector(".bar").querySelector(".bar_fill");
            IMU_ratio = value_total / data.Count;
            bar_fill.style.width = IMU_ratio * 100 + "%";
            bar_fill.style.backgroundColor = fillColor(ratio);
            // Update .array
            IMU_queue.dequeue();
            IMU_queue.enqueue(IMU_ratio);
            for (let i = 0; i < IMU_queue.length(); i++) {
                var child = document.getElementById(`child_imu${i + 1}`);
                const percentage = (IMU_queue.get(i) * 100).toFixed(0);
                child.innerHTML = `${percentage}%`;
                child.style.backgroundColor = fillColor(IMU_queue.get(i));
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
            text.innerHTML = "小吃部人流: 少";
        } else if (US_ratio <= 0.7 && IMU_ratio <= 0.7) {
            text.innerHTML = "小吃部人流: 普通";
        } else {
            text.innerHTML = "小吃部人流: 多";
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function initialize() {
    login();
    // const init = login();
    // Promise.all([init])
    // .then(() => {
    //     initialize();
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    // });
    setInterval(fetchData, interval);
}

document.addEventListener("DOMContentLoaded", initialize());

// TODO:
// Determine the threshold value of US and IMU.
// Give the past data when the website is launched.