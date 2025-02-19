const websiteInput = document.getElementById("websiteInput");
const addWebsiteBtn = document.getElementById("addWebsite");
const websitesListEl = document.getElementById("websitesList");
const waitTimeInput = document.getElementById("waitTime");
const challengeCheckbox = document.getElementById("challenge");
const saveSettingsBtn = document.getElementById("saveSettings");

let websites = [];

function renderWebsites() {
  websitesListEl.innerHTML = "";
  websites.forEach((site, index) => {
    const li = document.createElement("li");
    li.textContent = site;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.classList.add("removeBtn");
    removeBtn.addEventListener("click", () => {
      websites.splice(index, 1);
      renderWebsites();
    });

    li.appendChild(removeBtn);
    websitesListEl.appendChild(li);
  });
}

// load saved settings from storage when the options page is loaded
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["websites", "waitTime", "challenge"], (data) => {
    if (data.websites) {
      websites = data.websites;
    }
    renderWebsites();

    if (data.waitTime !== undefined) {
      waitTimeInput.value = data.waitTime;
    }
    challengeCheckbox.checked = data.challenge || false;
  });
});

// add a website to the list of blocked websites when button is clicked
addWebsiteBtn.addEventListener("click", () => {
  const newWebsite = websiteInput.value.trim();
  if (newWebsite && !websites.includes(newWebsite)) {
    websites.push(newWebsite);
    renderWebsites();
    websiteInput.value = "";
  } else if (websites.includes(newWebsite)) {
    alert("This website is already in the list.");
  }
});

// save settings to chrome.storage when button is clicked
saveSettingsBtn.addEventListener("click", () => {
  const waitTime = parseInt(waitTimeInput.value, 10);

  if (waitTime < 0 || isNaN(waitTime)) {
    alert("Please input a valid wait time in seconds that is 0 or greater!")
  }

  const challenge = challengeCheckbox.checked;
  chrome.storage.sync.set({ websites, waitTime, challenge }, () => {
    alert("Settings saved!");
  });
});
