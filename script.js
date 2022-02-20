/**
 * Constants
 */
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Helper functions
 */
function addStyle(styleString) {
  const style = document.createElement('style');
  style.textContent = styleString;
  document.head.append(style);
}

function querySelectorIncludesText(selector, text) {
  return Array.from(document.querySelectorAll(selector)).find(el => el.textContent.includes(text));
}

function pad(value) {
  return value < 10 ? `0${value}` : value;
}

function getDiff(date2, date1) {
  const diffInMs = Math.abs(date2.getTime() - date1.getTime());
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);

  return `${pad(diffInHours % 24)}:${pad(diffInMinutes % 60)}:${pad(diffInSeconds % 60)}`;
}

function getConnectedWallet() {
  const connectedWalletNode = querySelectorIncludesText('.stat-box .text-gray', 'Connected Wallet');
  return connectedWalletNode.previousElementSibling.textContent;
}

/**
 * UI Fixes
 */
addStyle(`.flex.px-20.py-5 > * { overflow-x: auto !important; }`); // Fix overflow on items

/**
 * UI Enhancements
 */
function addLoadingSection() {
  const section = document.createElement('section');
  section.id = 'loading-section';
  section.className = 'stat-box flex flex-col justify-center items-start w-full p-20 md:p-30 rounded-md mt-3rem';
  section.textContent = 'Loading';

  const insertPoint = document.getElementById('node-creator');
  insertPoint.parentNode.insertBefore(section, insertPoint);

  const poll = () => {
    setTimeout(() => {
      const loaded = !!querySelectorIncludesText('section .font-bold.text-16', 'Your Nodes');
      if (loaded) {
        section.remove();
      } else {
        poll();
      }
    }, 100);
  };

  poll();
}

function addRewardsCycleSection(connectedWallet, walletMetaData) {
  const claimDate = walletMetaData ? new Date(walletMetaData.claimDate) : null;
  let _claimDate = claimDate;

  const renderSummary = lastClaimDate => {
    if (!walletMetaData) {
      return `No data found for connected wallet.`;
    }

    const nextClaimDate = new Date(lastClaimDate);

    while (nextClaimDate.getTime() <= new Date().getTime()) {
      nextClaimDate.setTime(nextClaimDate.getTime() + ONE_DAY_IN_MS);
    }

    const timeDiff = getDiff(nextClaimDate, new Date());

    return `
       <div id="lastClaimDate" class="text-14 text-gray">Last claim date: ${lastClaimDate.toLocaleString()}</div>
       <div id="lastClaimDate" class="text-14 text-gray">Next claim date: ${nextClaimDate.toLocaleString()}</div>
       <div id="nextClaimCycle" class="text-14 text-gray">Claim cycle ends: ${timeDiff}</div>
     `;
  };

  const section = document.createElement('section');
  section.id = 'rewards-cycle-section';
  section.className = 'stat-box flex flex-col justify-center items-start w-full p-20 md:p-30 rounded-md mt-3rem';
  section.innerHTML = `
     <div class="text-18 md:text-20 font-bold">Next Rewards</div>
     <div class="flex w-full">
       <div id="rewards-cycle-summary" style="flex: 1">
         ${renderSummary(_claimDate)}
       </div>
       <div>
         <button id="resetTimer" class="btn-transparent px-10 mx-10 bg-gray-light rounded-md py-2 text-14">Reset timer</button>
       </div>
     </div>
   `;

  // Add to dom
  const insertPoint = document.getElementById('node-creator');
  insertPoint.parentNode.insertBefore(section, insertPoint);

  // Add event handlers
  document.getElementById('resetTimer').onclick = function () {
    _claimDate = new Date();
    chrome.storage.sync.set({ [connectedWallet]: { claimDate: _claimDate.toISOString() } });

    document.getElementById('rewards-cycle-summary').innerHTML = renderSummary(_claimDate);
  };

  // Start timers
  setInterval(() => {
    document.getElementById('rewards-cycle-summary').innerHTML = renderSummary(_claimDate);
  }, 1000);
}

// Initial load
addLoadingSection();
chrome.storage.sync.get('walletMeta', ({ walletMeta }) => {
  const connectedWallet = getConnectedWallet();
  const walletMetaData = walletMeta[connectedWallet];
  addRewardsCycleSection(connectedWallet, walletMetaData);
});
