chrome.runtime.onInstalled.addListener(() => {
    console.log("Job Eligibility Checker Extension Installed!");
});

// Function to check if page is a job posting
async function checkIfJobPage(tabId) {
    try {
        console.log("Checking if tab", tabId, "is a job page...");
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                const pageText = document.body.innerText.toLowerCase();
                const pageTitle = document.title.toLowerCase();
                const pageUrl = window.location.href.toLowerCase();
                
                console.log("Page title:", pageTitle);
                console.log("Page URL:", pageUrl);
                console.log("Page text sample:", pageText.substring(0, 200));
                
                // Job-related keywords to look for
                const jobKeywords = [
                    'job', 'career', 'position', 'employment', 'hiring', 'apply', 
                    'opportunity', 'role', 'opening', 'vacancy', 'recruitment',
                    'job description', 'job posting', 'career opportunity'
                ];
                
                // Check if any job keywords are found
                const hasJobKeywords = jobKeywords.some(keyword => 
                    pageText.includes(keyword) || 
                    pageTitle.includes(keyword) || 
                    pageUrl.includes(keyword)
                );
                
                console.log("Job keywords found:", hasJobKeywords);
                return hasJobKeywords;
            }
        });
        
        console.log("Job page check result:", results[0].result);
        return results[0].result;
    } catch (error) {
        console.error("Error checking if job page:", error);
        return false;
    }
}

// Function to update icon based on page type
function updateIcon(isJobPage) {
    console.log("Updating icon, isJobPage:", isJobPage);
    const iconPath = isJobPage ? {
        "16": "icon-16.png",
        "48": "icon-48.png",
        "128": "icon-128.png"
    } : {
        "16": "icon-gray-16.png",
        "48": "icon-gray-48.png",
        "128": "icon-gray-128.png"
    };
    
    chrome.action.setIcon({
        path: iconPath
    }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error setting icon:", chrome.runtime.lastError);
        } else {
            console.log(`Icon updated to ${isJobPage ? 'yellow' : 'gray'} (${isJobPage ? 'job page' : 'non-job page'})`);
        }
    });
}

// Listen for tab updates to check if it's a job page
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log("Tab updated:", tabId, changeInfo.status, tab.url);
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        console.log("Tab updated, checking if job page:", tab.url);
        const isJobPage = await checkIfJobPage(tabId);
        updateIcon(isJobPage);
    }
});

// Listen for tab activation to check current page
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log("Tab activated:", activeInfo.tabId);
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url && !tab.url.startsWith('chrome://')) {
            console.log("Tab activated, checking if job page:", tab.url);
            const isJobPage = await checkIfJobPage(activeInfo.tabId);
            updateIcon(isJobPage);
        }
    } catch (error) {
        console.error("Error getting tab info:", error);
    }
});

// Listen for popup opening and closing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request.action);
    
    if (request.action === "popupOpened") {
        console.log("Popup opened - keeping current icon color");
        // Don't change icon when popup opens, keep the current color
    } else if (request.action === "popupClosed") {
        console.log("Popup closed - keeping current icon color");
        // Don't change icon when popup closes, keep the current color
    } else if (request.action === "testJobDetection") {
        // Manual test trigger
        console.log("Manual test of job detection");
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            if (tabs[0]) {
                const isJobPage = await checkIfJobPage(tabs[0].id);
                updateIcon(isJobPage);
            }
        });
    }
});
