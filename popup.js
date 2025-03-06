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
            func: scanPage,
            args: [restrictedPhrases]  // Pass restrictedPhrases as an argument
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error("Error executing script:", chrome.runtime.lastError);
                return;
            }

            // Log the results for debugging
            console.log("Script execution results:", results);

            // Check if results is an array and contains the expected output
            if (!Array.isArray(results) || results.length === 0 || !results[0].result) {
                console.error("No results or result format is incorrect:", results);
                return;
            }

            let foundPhrases = results[0].result;
            let resultText = document.getElementById("result");
            let issuesList = document.getElementById("issues");

            // Clear any previous issues
            issuesList.innerHTML = "";

            // Validate foundPhrases and check if it's an array
            if (Array.isArray(foundPhrases) && foundPhrases.length > 0) {
                resultText.textContent = "⚠️ This job may not be suitable:";
                resultText.className = "warning";

                // Add each found phrase to the issues list
                foundPhrases.forEach(phrase => {
                    let li = document.createElement("li");
                    li.textContent = "❌ " + phrase;
                    issuesList.appendChild(li);
                });
            } else {
                resultText.textContent = "✅ This job looks good!";
                resultText.className = "safe";
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

document.getElementById("scan").addEventListener("click", checkJobEligibility);
