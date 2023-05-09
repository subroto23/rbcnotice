function downloadimage() {
    var container = document.getElementById("displayImg");
    html2canvas(container, { allowTaint: true }).then(function (canvas) {

        var link = document.createElement("a");
        document.body.appendChild(link);
        link.download = "html_image.jpg";
        link.href = canvas.toDataURL();
        link.target = '_blank';
        link.click();

    });
}
//বাটন নিয়ন্তণ
var adminSection = document.querySelector("#adminSection");
var submitbtn = document.querySelector("#submitbtn");
function buttoncal() {
    number();
    datecal();
    items();
    subject();
    noticeDetails();
    summarry();
    display();
    adminSection.style.display = "none";
    downloadimage();
}
//কি ধরনের নোটিশ লিখবেনঃ
function items() {
    var noticeCatagories  = document.querySelector("#noticeCatagories").value;
    var items = document.querySelector("#items");
    items.innerHTML = noticeCatagories;
}

function display(){
    var displayTop = document.querySelector(".displayTop");
    displayTop.style.display = "block";
}

//বিষয় লিখুন
function subject() {
    var subject = document.querySelector("#subject").value;
    var subjectValue = document.querySelector("#subjectValue");
    subjectValue.innerHTML = subject;
}
//নোটিশ লিখুন
function noticeDetails() {
    var noticedetails = document.querySelector("#noticedetails").value;
    var details = document.querySelector("#details");
    details.innerHTML = noticedetails;
}
//নোটিশ সারাংশ
function summarry() {
    var noticesummary = document.querySelector("#noticesummary").value;
    var summarydetails = document.querySelector("#summarydetails");
    summarydetails.innerHTML = noticesummary;
}
// নাম্বার
function number() {
    var noValue = document.querySelector("#noValue");
    noValue.innerHTML = `আরবিসি১৫/ক/${Math.floor(Math.random() * 1000000) + 1}`;
}

// তারিখের বিবারণ
function datecal() {
    var dateValue = document.querySelector("#dateValue");
    var now = new Date(); var dayNames = new Array("রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"); var monNames = new Array("জানুয়ারি", "ফেব্রুয়ারী", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর");
    dateValue.innerHTML = (`${now.getDate()} , ${monNames[now.getMonth()]} ${now.getFullYear()} , ${dayNames[now.getDay()]} `);
}
