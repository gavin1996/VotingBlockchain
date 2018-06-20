pragma solidity ^0.4.24;

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct VoterPpl {
        uint id;
        uint password;
    }

    //testing log
    event LogDep (address sender,    uint amount, uint balance);
    event LogPayment(address recipient, uint amount, uint balance);
    event LogErr (address recipient, uint amount, uint balance);

    // Store  
    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    mapping(address => string) public voterPpls;
    mapping(address => uint) public balances;
    // Store Candidates Count
    uint public candidatesCount;
    uint public voterCount;
    uint public paymentVal = 0.1*(10**18);
    address public owner;
    bool public initDeposit = false;

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );


    //returns ETH in this smart contract;
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // //allow other to send to this contract
    function depositContract (uint _cert) 
    payable 
    returns(bool success) {
        initDeposit = true;
        LogDep (msg.sender, msg.value, this.balance);
        return true;
    }

    //testing
    // function send() public {
    //      //msg.sender.transfer(10);
    //      msg.sender.buyCollectible(2, {from:web3.eth.accounts[1], value:web3.toWei(10,'ether')}
    // }

    //app.depositContract(2, {from:web3.eth.accounts[1], value:web3.toWei(10,'ether')})

    function receivePayment (address destination) 
    public 
    returns (bool) {
        destination.transfer(paymentVal);
        return true;
    }

    //testing
    function Election () public {

        addCandidate("Donald Trump");
        addCandidate("Kim Jong Un");
        addCandidate("John Cena");
        addCandidate("Billy Chen");
        owner = msg.sender;
    }

    function addCandidate (string _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    /*function send(address _receiver) payable {
        _receiver.send(10);
    }*/
    function addVoters (string _voterID, address sender) public {
        voterCount++;
        voterPpls[sender] = _voterID;
    }

    function vote (uint _candidateId, string _voterID) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;
        balances[msg.sender] += 12500;


        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        addVoters(_voterID, msg.sender);
        
        if(receivePayment(msg.sender)){
            LogPayment(msg.sender, paymentVal, this.balance);
        }

        // trigger voted event
        votedEvent(_candidateId);

    }
}
