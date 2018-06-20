App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  ownerApp: '0x0',
  hasVoted: false,
  //hasDeposited: false,
  init: function() {
    
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      //test
      App.contracts.Election.deployed().then(function(instance) {
        electionInstance = instance;
        //return electionInstance.initDeposit();
        return electionInstance.owner();
      }).then(function(owner){
        App.ownerApp = owner;
        return electionInstance.initDeposit();
      }).then(function(initDeposit){
        if(initDeposit != true){
          if(App.ownerApp == App.account){
            return electionInstance.depositContract(2, {from:App.account, value:web3.toWei(10,'ether')});
          }
        }
      })

      //.then(function(initDeposit){

      //   console.log(initDeposit);

      //   if(initDeposit == true){
      //     return '';
      //   }else{
      //     //App.ownerApp = owner;
      //     return electionInstance.owner();
      //   }
      // }).then(function(owner){
      //     if(owner != '') App.ownerApp = owner;
      //     if(App.ownerApp == App.account){
      //       return electionInstance.depositContract(2, {from:App.account, value:web3.toWei(10,'ether')});
      //     }
      // })
      //return electionInstance.depositContract(2, {from:App.account, value:web3.toWei(10,'ether')});

      //test

      return App.render();
    });

  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 'latest',
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();
    $("#lol").hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
 
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {

        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      //return electionInstance.buyCollectible(2, {from:App.account, value:web3.toWei(1,'ether')});
      return electionInstance.getBalance();
    })
    // .then(function(){
    //   return electionInstance.getBalance();
    // })
    .then(function(balances) {
      $("#accountTokens").html("Smart Contract Balance (Wei) : " + balances);
      return electionInstance.voterPpls(App.account);
    }).then(function(acc) {
      $("#Thanks").html("Thank you, " + acc + " for Voting <br>");

      return electionInstance.paymentVal();
    }).then(function(paymentVal){
      $("#Thanks").append(paymentVal/(10**18) + " ETH has been deposited to your address");

      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
        $("#lol").show();
      }

    App.contracts.Election.deployed().then(function(instance){
      return instance.owner();
    }).then(function(owner){
      if(owner == App.account){
        $("#lol").hide();
        $('form').hide();
        $("#accountAddress").empty;
        $("#accountAddress").html("You are the creator of this Smart Contract. <br> Your Account: " + owner);
      }
    })
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    var voterId = $('#voterID').val();
    
    App.contracts.Election.deployed()
    // .then(function(instance){
    //   electionInstance = instance;
    //   return electionInstance.addVoters(voterId, { from: App.account });
    // })
    .then(function(instance) {
      return instance.vote(candidateId, voterId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
