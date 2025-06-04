// Array of mindfulness quotes for typing challenge
const mindfulnessQuotes = [
  "The present moment is the only time over which we have dominion.",
  "Mindfulness isn't difficult, we just need to remember to do it.",
  "Peace comes from within. Do not seek it without.",
  "The mind is everything. What you think you become.",
  "Every morning we are born again. What we do today matters most."
];

// Retrieve settings and stored original URL and site
chrome.storage.sync.get(["waitTime", "challengeType"], (settings) => {
  chrome.storage.local.get(["originalURL", "originalSite"], (data) => {
    const originalURL = data.originalURL || "about:blank";
    const originalSite = data.originalSite;

    if (!originalSite) {
      redirectTo(originalURL);
      return;
    }

    switch (settings.challengeType) {
      case "math":
        showMathChallenge(originalURL, originalSite);
        break;
      case "typing":
        showTypingChallenge(originalURL, originalSite);
        break;
      default:
        startCountdown(settings.waitTime, originalURL, originalSite);
    }
  });
});

// Countdown timer function with whitelist update
function startCountdown(seconds, originalURL, originalSite) {
  const messageDiv = document.getElementById("message");
  let counter = seconds;
  messageDiv.textContent = `Please wait for ${counter} second(s)...`;

  const interval = setInterval(() => {
    counter--;
    if (counter > 0) {
      messageDiv.textContent = `Please wait for ${counter} second(s)...`;
    } else {
      clearInterval(interval);
      // set the access period 
      setAccessPeriod(originalURL, originalSite);
    }
  }, 1000);
}

function showMathChallenge(originalURL, originalSite) {
  const mathBox = document.getElementById("mathBox");
  const messageDiv = document.getElementById("message");
  mathBox.style.display = "block";

  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const correctAnswer = a + b;

  document.getElementById("mathQuestion").textContent = `${a} + ${b} = ?`;
  messageDiv.textContent = "Solve the challenge to continue:";

  document.getElementById("submitMathAnswer").addEventListener("click", () => {
    const userAnswer = parseInt(document.getElementById("mathAnswer").value, 10);
    if (userAnswer === correctAnswer) {
      setAccessPeriod(originalURL, originalSite);
    } else {
      alert("Incorrect answer. Try again!");
    }
  });
}

function showTypingChallenge(originalURL, originalSite) {
  const typingBox = document.getElementById("typingBox");
  const messageDiv = document.getElementById("message");
  const typingText = document.getElementById("typingText");
  const typingInput = document.getElementById("typingInput");
  const typingFeedback = document.getElementById("typingFeedback");
  
  typingBox.style.display = "block";
  messageDiv.textContent = "Complete the typing challenge to continue:";

  // Select a random quote
  const quoteToType = mindfulnessQuotes[Math.floor(Math.random() * mindfulnessQuotes.length)];
  typingText.textContent = quoteToType;

  document.getElementById("submitTypingAnswer").addEventListener("click", () => {
    const userInput = typingInput.value.trim();
    
    if (userInput === quoteToType) {
      typingFeedback.textContent = "Perfect! Redirecting...";
      typingFeedback.className = "success";
      setAccessPeriod(originalURL, originalSite);
    } else {
      typingFeedback.textContent = "The text doesn't match exactly. Please try again.";
      typingFeedback.className = "error";
    }
  });
}

// sets the access period for the site 
function setAccessPeriod(originalURL, originalSite) {
  // access duration needs to be in ms
  const accessDurationMs = 5 * 60 * 1000; 
  const challengePassedUntil = Date.now() + accessDurationMs;
  
  // Save the new expiry timestamp for the site.
  let updateObj = {};
  updateObj[originalSite] = challengePassedUntil;
  chrome.storage.local.set(updateObj, () => {
    // Clean up temporary keys before redirecting.
    chrome.storage.local.remove(["originalURL", "originalSite"], () => {
      redirectTo(originalURL);
    });
  });
}

function redirectTo(url) {
  window.location.href = url;
}
  