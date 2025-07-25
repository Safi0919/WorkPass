const restrictedPhrases = [
    "U.S. citizen",
    "does not provide sponsorship",
    "do not provide sponsorship",
    "clearance required",
    "security clearance",
    "TS/ SCI with Poly",
    "citizenship required",
    "unrestricted access",
    "not able to sponsor visas",
    "No visa sponsorship available",
    "Applicants must have permanent US work authorization",
    "Only US citizens or permanent residents will be considered",
    "We do not offer visa sponsorship for this position",
    "Candidates must be eligible to work in the US without sponsorship",
    "This position does not qualify for company-sponsored work authorization",
    "Applicants requiring visa sponsorship will not be considered",
    "Must have unrestricted work authorization in the United States"
];

function checkJobEligibility() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (phrases) => {
                let pageText = document.body.innerText.toLowerCase();
                let found = phrases.filter(p => pageText.includes(p.toLowerCase()));
                return { foundPhrases: found, fullText: pageText };
            },
            args: [restrictedPhrases]
        }, async (results) => {
            if (!results || !results[0].result) return;

            let { foundPhrases, fullText } = results[0].result;

            let resultText = document.getElementById("result");
            let issuesList = document.getElementById("issues");
            issuesList.innerHTML = "";

            // 🔁 Call your AI API here
            let aiResult = await analyzeWithAI(fullText);

            // New Logic Flow
            if (Array.isArray(foundPhrases) && foundPhrases.length > 0) {
                // String match found - REJECT (Red)
                resultText.textContent = "❌ Not eligible – Sponsorship-restrictive keywords found";
                resultText.className = "reject";
                foundPhrases.forEach(phrase => {
                    let li = document.createElement("li");
                    li.textContent = "❌ " + phrase;
                    issuesList.appendChild(li);
                });
            } else if (aiResult === "Not Friendly") {
                // No string match but AI says 'Not Friendly' - UNSURE (Gray)
                resultText.textContent = "⚠️ Possibly ineligible – No strict keywords found, but AI flagged it";
                resultText.className = "unsure";
            } else {
                // No string match and AI says 'Friendly' - ACCEPT (Green)
                resultText.textContent = "✅ Looks eligible – No sponsorship issues found";
                resultText.className = "accept";
            }
        });
    });
}


function scanPage(restrictedPhrases) {
    let pageText = document.body.innerText.toLowerCase();
    console.log("Page content scanned:", pageText);  // Log the text being scanned

    // Return the filtered phrases found on the page
    let foundPhrases = restrictedPhrases.filter(phrase => pageText.includes(phrase.toLowerCase()));
    return foundPhrases;
}

async function analyzeWithAI(text) {
    let resultText = document.getElementById("result");
    // Show a loading message immediately
    resultText.textContent = "Analyzing...";

    // Set a timer to show the server startup message if it takes too long
    let startupTimeout = setTimeout(() => {
        resultText.textContent = "Kindly wait, the server is starting up...";
    }, 3000); // 3 seconds

    try {
        let response = await fetch('https://job-ai-api.onrender.com/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        let result = await response.json();
        clearTimeout(startupTimeout); // Clear the timer if the server responds
        return result.prediction;
    } catch (error) {
        clearTimeout(startupTimeout);
        console.error("AI analysis failed:", error);
        return "Error";
    }
}


document.getElementById("scan").addEventListener("click", checkJobEligibility);

// Add dynamic gradient effect to scan button
const scanBtn = document.getElementById('scan');
scanBtn.classList.add('dynamic-gradient');

scanBtn.addEventListener('mousemove', function(e) {
  const rect = this.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  this.style.background = `radial-gradient(circle at ${x}px ${y}px, #a259f7 0%, #38b6ff 100%)`;
});

scanBtn.addEventListener('mouseleave', function() {
  this.style.background = 'none';
});

// Create one persistent spotlight element
const spotlight = document.createElement("div");
spotlight.className = "spotlight";
document.body.appendChild(spotlight);

document.addEventListener("mousemove", (e) => {
  spotlight.style.left = `${e.clientX - 60}px`;
  spotlight.style.top = `${e.clientY - 60}px`;
});

const popupContainer = document.querySelector('.popup-container');

// Hide the spotlight when the mouse leaves the popup
popupContainer.addEventListener('mouseleave', () => {
  spotlight.style.display = 'none';
});

// Show the spotlight again when the mouse enters the popup
popupContainer.addEventListener('mouseenter', () => {
  spotlight.style.display = '';
});

// LinkedIn button functionality
document.getElementById('linkedin-btn').addEventListener('click', function() {
  const linkedinUrl = 'https://www.linkedin.com/in/safiullahsaif/';
  window.open(linkedinUrl, '_blank');
});

// Popup is now focused on job scanning functionality
// Icon changes are handled automatically by the background script
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup opened - ready for job scanning');
  
  // Add a test button for debugging
  const testButton = document.createElement('button');
  testButton.textContent = 'Test Job Detection';
  testButton.style.marginTop = '10px';
  testButton.addEventListener('click', () => {
    console.log('Test button clicked');
    chrome.runtime.sendMessage({action: "testJobDetection"});
  });
  document.body.appendChild(testButton);
});
