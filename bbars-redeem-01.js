"use strict";

/**
 * Example JavaScript code that connects wallets and mints NFT.
 */

 // Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;
const ethers = window.ethers;
// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider;

// Address of the selected account
let selectedAccount;

// Contract Details
// DEFAULT RINKEBY TESTING NFT CONTRACT ADDRESS
const contractAddress = "0x50aDB1d3fb9fa3cc2383560D09b5E08027cEBB24";
//Declaration of functions you want to call
const Abi = [
"function mint(uint256 numberOfTokens) public payable",
"function totalSupply() view returns(uint)",
"function _maxAmount() view returns(uint)",
"function _price() view returns(uint)"
];

/**
 * Setup the orchestra
 */
function init() {

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  if(location.protocol !== 'https:') {Bc540B5389dE3a68D86fD8d03aDeDbAD05
    // https://ethereum.stackexchange.com/a/62217/620
    const alert = document.querySelector("#alert-error-https");
    alert.style.display = "block";
    document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
    return;
  }

  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        // 8043bb2cf99347b1bfadfb233c5325c0
        infuraId: "87b399cd619c42cf912e18219ac53563",
      }
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
}


/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {

  // Get a Web3 instance for the wallet
  const web3 = new Web3(provider);

  console.log("Web3 instance is", web3);

  // Get connected chain id from Ethereum node
  const chainId = await web3.eth.getChainId();
  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
 // document.querySelector("#network-name").textContent = chainData.name;

  // Get list of accounts of the connected wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

 document.querySelector("#selected-account").textContent = `${selectedAccount.slice(0,4)}...${selectedAccount.slice(38,42)}`;

  // Get a handl
    /* const template = document.querySelector("#template-balance");
  const accountContainer = document.querySelector("#accounts");

  // Purge UI elements any previously loaded accounts
  accountContainer.innerHTML = '';

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    // Fill in the templated row and put in the document
    const clone = template.content.cloneNode(true);
    clone.querySelector(".address").textContent = address;
    clone.querySelector(".balance").textContent = humanFriendlyBalance;
    accountContainer.appendChild(clone);
  });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  await Promise.all(rowResolvers);
    */

  // Display fully loaded UI for wallet data
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";
}


/**
 * Mint NFT button.
 */
async function mint() {
    //Connect ethers with provider
    const eth = new ethers.providers.Web3Provider(provider);
    const signer = eth.getSigner();

    const nftContract = new ethers.Contract(contractAddress, Abi, signer);
    
    try {
    //Get number of nft to mint
    const amount = Number(document.querySelector("#typeNumber").value);
    const totalCost = await nftContract._price() * amount;

    const tx = await nftContract.mint(amount,{value: ethers.BigNumber.from(String(totalCost))});
    // Inform user that tx has began
    document.querySelector("#nftAlert").textContent = "Transaction successfully submitted and pending.";
    //Wait until transaction verifies
    await tx.wait();
    // Confirmation and redirect to tx
    document.querySelector("#nftAlert").textContent = `Successfully Minted ${amount} NFT`; 
    document.querySelector("#nftLink").innerHTML = `<a src="https://www.etherscan.io/tx/${tx.hash}">https://www.etherscan.io/tx/${tx.hash}</a>`;
    } catch(err) { 
        alert("Something went wrong please try again!");
    }
}

/**
 * Chek Amount NFT left.
 */
async function amountLeft() {
    //Connect ethers with provider
    const eth = new ethers.providers.Web3Provider(provider);
    const signer = eth.getSigner();

    const nftContract = new ethers.Contract(contractAddress, Abi, signer);

    try{
        const maxAmount = await nftContract._maxAmount();
        const totalSupply = await nftContract.totalSupply();
        const _amountLeft = String(maxAmount - totalSupply);
        // Populate HTML
        document.querySelector("#amountLeft").textContent = `${_amountLeft}`; 
    } catch(err) {

    }
}
/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {
 // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled")
}

/**
 * Connect wallet button pressed.
 */
async function onConnect() {

  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();
  await amountLeft();
  init_nft_contract();
  populateForm();
}

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {

  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if(provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}


// Start of form script
const address = '0x50aDB1d3fb9fa3cc2383560D09b5E08027cEBB24';
const contractAbi = [
  "function balanceOf(address) view returns (uint)",
	"function tokenOfOwnerByIndex(address, uint) view returns (uint)"
];
let signer;
let contract;

// Initialize Metamask provider
function init_nft_contract() {
  const Provider = new ethers.providers.Web3Provider(provider)
  signer = Provider.getSigner()
	contract = new ethers.Contract(address, contractAbi, Provider);
}

// Get token ids of user
async function tokensToRedeem() {
	try{
		let tokenIds = [];
		const addr = await signer.getAddress();
		const balance = await contract.balanceOf(addr);
		// Get tokenIds
		for(let i = 0; i < Number(balance); i++) {
			const id = await contract.tokenOfOwnerByIndex(addr,i);
			tokenIds.push(String(id));
		}	
		return [tokenIds, addr];
	} catch(err){
		console.log(err);
	}		
}

// Add tokenIds selection to form
async function populateForm() {
	const [tokens, addr] = await tokensToRedeem();
	const ul = document.querySelector("#add-token");		
	// Add address to form
	const form = document.querySelector("#wf-form-BBars-NFT-Redemption-Form");		
	const input = document.createElement("input");
	input.setAttribute("type", "hidden");
	input.setAttribute("value", addr);
	input.setAttribute("data-name", "Wallet");
	form.append(input);
	// Populate user owned nfts 
	for(let value of tokens) {
	ul.insertAdjacentHTML('beforeend', `
		<li class="token-list-item">
			<label id="token" class="w-checkbox checkbox-field-bars">
				<div class="w-checkbox-input w-checkbox-input--inputType-custom checkbox">
				</div>
				<input type="checkbox" name="Token-ID-${value}" id="Token-ID-1" data-name="Token ID ${value}" value="${value}" style="opacity:0;position:absolute;z-index:-1">
				<span for="Token-ID-${value}" class="checkbox-label w-form-label">bitcoin bar<span class="label-small-span"><br>Token ID: ${value}</span></span>
				<div class="logo-wrap">
					<img src="https://uploads-ssl.webflow.com/60aeba699cbed144e00e4216/61ee2b09334fc99b8a382279_bar-sample%201.png" loading="lazy" alt="" class="image-4" width="48">
				</div>
			</label>
		</li>`);
	}
}

/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);
  document.querySelector("#btn-mint").addEventListener("click", mint);
});
