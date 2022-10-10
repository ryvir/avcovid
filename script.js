var container, infoContainer, infoBox, infoLine, prevSelectedBar, info, barContainer, left, stats, length, fadeEffect, delay;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyCT2-7iJizJRk3iPE3dDsBDI5yEo5wgx9Y",
    authDomain: "avcovid-fbe79.firebaseapp.com",
    projectId: "avcovid-fbe79",
    storageBucket: "avcovid-fbe79.appspot.com",
    messagingSenderId: "297733948813",
    appId: "1:297733948813:web:53c8fd7b91a36ea33d69c4",
    measurementId: "G-6F46MJ1KCB"
});

const storage = firebase.storage();
const ref = storage.ref('stats.json');
ref.getDownloadURL().then(url => {
    fetch(url)
    .then(response => response.text())
    .then(data => {
        stats = JSON.parse(data);
        length = 3 * stats.length + 22;
        document.querySelector("#key").innerHTML = "<span id=\"new-cases-key\"></span> New cases&nbsp;&nbsp;&nbsp; <span id=\"average-key\"></span> 5-day average"
        display();
    });
});

ref.getMetadata().then(meta => {
    var updated = new Date(meta.updated);
    document.querySelector("#footer").innerHTML = `<small>All data is from PUSD ParentSquare. Last updated: ${getTimeSince(updated)}.<br>Copyright &copy; 2022 Ryan Vir</small>`;
});

function getTimeSince(date) {
    var today = new Date();
    var hoursSince = Math.floor((today.getTime() - date.getTime()) / (1000 * 3600));
    if (hoursSince < 24) {
        return `${hoursSince} hour${hoursSince == 1 ? '' : 's'} ago`
    } else {
        return `${Math.floor(hoursSince / 24)} day${(Math.floor(hoursSince / 24)) == 1 ? '' : 's'} ago`
    }
}

function display() {
    container = document.querySelector("#container");
    if (window.innerHeight > window.innerWidth) {
        container.setAttribute("viewBox", `0 0 ${length} 450`);
        container.ontouchstart = mobileTouch;
    } else {
        container.setAttribute("width", length);
        container.setAttribute("height", "450");
        container.onmousemove = mouseMove;
    }
    container.style.display = "";
    left = container.getBoundingClientRect().left;
    window.onresize = resize;

    barContainer = document.querySelector("#bars");

    info = document.querySelectorAll(".info");
    infoBox = document.querySelector("#info-box");
    infoLine = document.querySelector("#info-line");
    infoContainer = document.querySelector("#info-container");

    document.querySelector("#footer").style.display = "";
    document.querySelector("#asterisk").style.display = "";
    
    var totalCount = 0;
    var prevDot = [0, 0];
    stats.forEach((element, index) => {
        var cases = element[1] >= 0 ? element[1] : 0;
        let bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.setAttribute("x", `${3 * index + 20}`);
        bar.setAttribute("y", `${400 - 20 * cases}`);
        bar.setAttribute("width", "3");
        bar.setAttribute("height", `${20 * cases}`);
        bar.setAttribute("fill", "#999");
        bar.setAttribute("opacity", "1");
        bar.classList.add("bar");
        barContainer.appendChild(bar);

        if (!(index === 0) && (element[0].substring(0, 2) !== stats[index - 1][0].substring(0, 2))) { // new month
            if (stats.length - index > 18) {
                let date = document.createElementNS("http://www.w3.org/2000/svg", "text");
                if (!container.getAttribute("viewBox")) {
                    date.innerHTML = months[parseInt(element[0].substring(0, 2)) - 1] + " '" + element[0].slice(-2);
                } else {
                    date.innerHTML = parseInt(element[0].substring(0, 2)) + "/" + element[0].slice(-2);
                    date.setAttribute("font-size", "140%")
                }
                date.setAttribute("x", `${3 * index + 18}`);
                date.setAttribute("y", "430");
                document.querySelector("#x-axis").appendChild(date);
            }

            let dateLine = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            dateLine.setAttribute("x", `${3 * index + 21}`);
            dateLine.setAttribute("y", "400");
            dateLine.setAttribute("width", "1");
            dateLine.setAttribute("height", "10");
            dateLine.setAttribute("fill", "black");
            dateLine.setAttribute("opacity", "1");
            document.querySelector("#x-axis").appendChild(dateLine);
        }

        let rollingAverage;
        if (index > 1 && index < stats.length - 2) {
            rollingAverage = (Math.max(stats[index - 2][1], 0) + Math.max(stats[index - 1][1], 0) + cases + Math.max(stats[index + 1][1], 0) + Math.max(stats[index + 2][1], 0)) / 5;
        } else if (index == 1) {
            rollingAverage = (Math.max(stats[index - 1][1], 0) + cases + Math.max(stats[index + 1][1], 0) + Math.max(stats[index + 2][1], 0)) / 5;
        } else if (index == 0) {
            rollingAverage = (cases + Math.max(stats[index + 1][1], 0) + Math.max(stats[index + 2][1], 0)) / 5;
        } else if (index == stats.length - 2) {
            rollingAverage = (Math.max(stats[index - 2][1], 0) + Math.max(stats[index - 1][1], 0) + cases + Math.max(stats[index + 1][1], 0)) / 5;
        } else if (index == stats.length - 1) {
            rollingAverage = (Math.max(stats[index - 2][1], 0) + Math.max(stats[index - 1][1], 0) + cases) / 5;
        }
        element.push(rollingAverage.toFixed(1));

        let x = 3 * index + 22;
        let y = 400 - 20 * rollingAverage

        if (!(prevDot[0] === 0 && prevDot[1] === 0)) {
            let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", `${prevDot[0]}`);
            line.setAttribute("y1", `${prevDot[1]}`);
            line.setAttribute("x2", `${x}`);
            line.setAttribute("y2", `${y}`);
            line.setAttribute("stroke", "red");
            line.setAttribute("stroke-width", "2");
            barContainer.appendChild(line);
        }

        prevDot = [x, y];
        totalCount += cases;
    });

    // indicator of mask mandate lift
    // let mask = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    // mask.setAttribute("x", `${3 * 153 + 20}`);
    // mask.setAttribute("y", "0");
    // mask.setAttribute("width", "3");
    // mask.setAttribute("height", "400");
    // mask.setAttribute("fill", "red");
    // mask.setAttribute("opacity", ".1");
    // barContainer.appendChild(mask);
    
    // indicator of when omicron started
    // let omicron = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    // omicron.setAttribute("x", `${3 * 109 + 20}`);
    // omicron.setAttribute("y", "0");
    // omicron.setAttribute("width", "3");
    // omicron.setAttribute("height", "400");
    // omicron.setAttribute("fill", "red");
    // omicron.setAttribute("opacity", ".1");
    // barContainer.appendChild(omicron);

    document.querySelector("#total").innerText = `\nTotal: ${totalCount} cases`;
}

function mouseMove(e) {
    if (!(e.layerX % 3 === 0)) return;
    var xCoor;
    if (e.layerX > (left + 59) && e.layerX < (left + (3 * stats.length - 41))) {
        xCoor = e.layerX - left;
    } else if (e.layerX >= (left + (3 * stats.length - 41))) {
        xCoor = 3 * stats.length - 39;
    } else if (e.layerX <= (left + 59) && e.layerX >= (left + 20)) {
        xCoor = 59;
    } else if (e.layerX <= (left + 20)) {
        infoContainer.style.display = "none";
        return;
    }

    xCoor /= container.getBoundingClientRect().width / (length);

    if (infoContainer.style.display === "none") infoContainer.style.display = "";

    container.onmouseleave = () => {
        infoContainer.style.display = "none";
        if (prevSelectedBar) prevSelectedBar.setAttribute("fill", "#999");
    }

    info.forEach(element => {
        element.setAttribute("x", xCoor);
    })
    infoBox.setAttribute("x", xCoor - 58);
    infoLine.setAttribute("x1", (parseInt(Array.from(barContainer.children)[Math.max(0, 2 * Math.floor((e.layerX - left - 23) / 3) - 1)].getAttribute("x")) + 2));
    infoLine.setAttribute("x2", (parseInt(Array.from(barContainer.children)[Math.max(0, 2 * Math.floor((e.layerX - left - 23) / 3) - 1)].getAttribute("x")) + 2));

    document.getElementsByClassName("bar")[Math.max(0, Math.floor((e.layerX - left - 20) / 3)) - 1].setAttribute("fill", "dimgray");
    if (prevSelectedBar && prevSelectedBar != document.getElementsByClassName("bar")[Math.max(0, Math.floor((e.layerX - left - 20) / 3)) - 1]) prevSelectedBar.setAttribute("fill", "#999");
    prevSelectedBar = document.getElementsByClassName("bar")[Math.max(0, Math.floor((e.layerX - left - 20) / 3)) - 1];


    if (stats[Math.floor((e.layerX - left - 20) / 3) - 1]) {
        info[0].innerHTML = `${stats[Math.floor((e.layerX - left - 20) / 3) - 1][0]}`
        if (stats[Math.floor((e.layerX - left - 20) / 3) - 1][1] >= 0) {
            info[1].innerHTML = `New cases: ${stats[Math.floor((e.layerX - left - 20) / 3) - 1][1]}`
        } else {
            info[1].innerHTML = `New cases: 0*`
        }
        info[2].innerHTML = `5 day avg: ${stats[Math.floor((e.layerX - left - 20) / 3) - 1][2]}`
    }
}

function mobileTouch(e) {
    e.preventDefault();
    var touchX = Math.floor(e.touches[0].clientX) + 2;
    var width = container.getBoundingClientRect().width;
    var xCoor;
    if ((touchX / width) > 0.96) {
        xCoor = 0.936 * width;
    } else if ((touchX / width) < 0.09 && (touchX / width) > 0.0478) {
        xCoor = 0.066 * width;
    } else if ((touchX / width) < 0.0478) {
        return;
    } else {
        xCoor = touchX - left;
    }

    xCoor /= container.getBoundingClientRect().width / (length);

    infoContainer.style.display = "";
    
    info.forEach(element => {
        element.setAttribute("x", xCoor);
    })
    infoBox.setAttribute("x", xCoor - 58);
    infoLine.setAttribute("x1", (parseInt(Array.from(barContainer.children)[Math.max(0, 2 * Math.floor((((touchX - left) * (length / width)) - 23) / 3) - 1)].getAttribute("x")) + 2));
    infoLine.setAttribute("x2", (parseInt(Array.from(barContainer.children)[Math.max(0, 2 * Math.floor((((touchX - left) * (length / width)) - 23) / 3) - 1)].getAttribute("x")) + 2));

    if (stats[Math.floor((((touchX - left) * (length / width)) - 22) / 3)]) {
        info[0].innerHTML = `${stats[Math.floor((((touchX - left) * (length / width)) - 22) / 3)][0]}`
        if (stats[Math.floor((((touchX - left) * (length / width)) - 22) / 3)][1] >= 0) {
            info[1].innerHTML = `New cases: ${stats[Math.floor((((touchX - left) * (length / width)) - 22) / 3)][1]}`
        } else {
            info[1].innerHTML = `New cases: 0*`
        }
        info[2].innerHTML = `5 day avg: ${stats[Math.floor((((touchX - left) * (length / width)) - 22) / 3)][2]}`
    }

    fadeOutInfo();
}

function fadeOutInfo() {
    clearInterval(fadeEffect);
    clearTimeout(delay);
    infoContainer.style.opacity = 1;
    delay = setTimeout(() => {
        fadeEffect = setInterval(function () {
            if (infoContainer.style.opacity > 0) {
                infoContainer.style.opacity -= 0.05;
            } else {
                clearInterval(fadeEffect);
                fadeEffect = null;
                infoContainer.style.display = "none";
                infoContainer.style.opacity = null;
            }
        }, 100);
    }, 2000);
}

function resize() {
    if (window.innerHeight > window.innerWidth || window.innerWidth < length) {
        container.setAttribute("viewBox", `0 0 ${length} 450`);
        if (container.getAttribute("width") && container.getAttribute("height")) {
            Array.from(document.querySelectorAll("#x-axis > text")).forEach(element => {
                element.innerHTML = `${months.indexOf(element.innerHTML.substring(0, 3)) + 1}/${element.innerHTML.slice(-2)}`;
                element.setAttribute("font-size", "140%");
            })
            container.removeAttribute("width");
            container.removeAttribute("height");
            container.onmousemove = null;
            container.ontouchstart = mobileTouch;
        }
    } else {
        container.setAttribute("width", length);
        container.setAttribute("height", "450");
        if (container.getAttribute("viewBox")) {
            Array.from(document.querySelectorAll("#x-axis > text")).forEach(element => {
                element.innerHTML = `${months[element.innerHTML.charAt(0) - 1]} '${element.innerHTML.slice(-2)}`;
                element.setAttribute("font-size", "100%");
            })
            container.removeAttribute("viewBox");
            container.onmousemove = mouseMove;
            container.ontouchstart = null;
        }
    }
    left = container.getBoundingClientRect().left;
}
