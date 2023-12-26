function login() {
    // We use CORS proxy server to avoid the Access-Control-Allow-Origin issue.
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
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
            throw new Error(`HTTP error status: ${response.status}.`);
        }
        return response.json();
    })
    .then(data => {
        alert("Data get successfully.");
        console.log("Data:", data);
    })
    .catch(error => {
        alert("Data get failed.")
        console.error("Error:", error);
    });
}

function fetchData() {

}

function initialize() {
    login();
    setInterval(fetchData, 60000);
}

document.addEventListener("DOMContentLoaded", initialize());