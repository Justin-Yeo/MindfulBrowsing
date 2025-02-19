// Retrieve settings and stored original URL and site
chrome.storage.sync.get(["waitTime", "challenge"], (settings) => {
    chrome.storage.local.get(["originalURL", "originalSite"], (data) => {
      const originalURL = data.originalURL || "about:blank";
      const originalSite = data.originalSite;
  
      if (!originalSite) {
        redirectTo(originalURL);
        return;
      }
  
      if (settings.challenge) {
        showMathChallenge(originalURL, originalSite);
      } else {
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
    const challengeBox = document.getElementById("challengeBox");
    const messageDiv = document.getElementById("message");
    challengeBox.style.display = "block";
  
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const correctAnswer = a + b;
  
    document.getElementById("mathQuestion").textContent = `${a} + ${b} = ?`;
    messageDiv.textContent = "Solve the challenge to continue:";
  
    document.getElementById("submitAnswer").addEventListener("click", () => {
      const userAnswer = parseInt(document.getElementById("mathAnswer").value, 10);
      if (userAnswer === correctAnswer) {
        setAccessPeriod(originalURL, originalSite);
      } else {
        alert("Incorrect answer. Try again!");
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
  