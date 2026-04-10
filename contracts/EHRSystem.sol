// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EHRSystem {
    
    // --- STATE VARIABLES ---
    
    address public admin;
    bool private locked; 

    struct Record {
        string ipfsHash;
        string recordType;
        uint256 timestamp;
        address addedBy;
    }

    struct Doctor {
        address id;
        bool isValid;
    }

    struct Patient {
        address id;
        bool isRegistered; 
        Record[] records;
        mapping(address => bool) authorizedProviders;
    }

    mapping(address => Doctor) public doctors;
    mapping(address => Patient) public patients;

    // --- EVENTS ---
    event PatientRegistered(address indexed patient, uint256 timestamp);
    event DoctorAdded(address indexed doctor, uint256 timestamp);
    event DoctorRemoved(address indexed doctor, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed provider, uint256 timestamp);
    event AccessRevoked(address indexed patient, address indexed provider, uint256 timestamp);
    event RecordAdded(address indexed patient, address indexed addedBy, string ipfsHash, uint256 timestamp);

    // --- MODIFIERS ---

    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy detected");
        locked = true;
        _;
        locked = false;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address: Zero address detected");
        _;
    }

    modifier nonEmptyString(string memory _str) {
        require(bytes(_str).length > 0, "Invalid input: String cannot be empty");
        _;
    }

    modifier onlyRegisteredPatient(address _patient) {
        require(patients[_patient].isRegistered, "Patient is not registered");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // --- 1. USER MANAGEMENT ---

    function registerPatient() public nonReentrant {
        require(!patients[msg.sender].isRegistered, "Patient already registered");
        patients[msg.sender].id = msg.sender;
        patients[msg.sender].isRegistered = true;
        emit PatientRegistered(msg.sender, block.timestamp);
    }

    function addDoctor(address _doctor) public onlyAdmin validAddress(_doctor) nonReentrant {
        require(!doctors[_doctor].isValid, "Doctor already registered");
        doctors[_doctor] = Doctor(_doctor, true);
        emit DoctorAdded(_doctor, block.timestamp);
    }

    function removeDoctor(address _doctor) public onlyAdmin validAddress(_doctor) nonReentrant {
        require(doctors[_doctor].isValid, "Doctor not active or registered");
        doctors[_doctor].isValid = false;
        emit DoctorRemoved(_doctor, block.timestamp);
    }

    // --- 2. ACCESS CONTROL ---

    function grantAccess(address _provider) 
        public 
        onlyRegisteredPatient(msg.sender) 
        validAddress(_provider) 
        nonReentrant 
    {
        require(doctors[_provider].isValid, "Provider is not a valid registered doctor");
        patients[msg.sender].authorizedProviders[_provider] = true;
        emit AccessGranted(msg.sender, _provider, block.timestamp);
    }

    function revokeAccess(address _provider) 
        public 
        onlyRegisteredPatient(msg.sender)
        validAddress(_provider) 
        nonReentrant 
    {
        require(patients[msg.sender].authorizedProviders[_provider], "Access was not granted");
        patients[msg.sender].authorizedProviders[_provider] = false;
        emit AccessRevoked(msg.sender, _provider, block.timestamp);
    }

    // --- 3. RECORD MANAGEMENT ---

    function addRecord(
        address _patientAddress, 
        string memory _ipfsHash, 
        string memory _recordType
    ) 
        public 
        validAddress(_patientAddress)
        nonEmptyString(_ipfsHash)
        nonEmptyString(_recordType)
        onlyRegisteredPatient(_patientAddress) 
        nonReentrant 
    {
        
        if (msg.sender != _patientAddress) {
            
            require(doctors[msg.sender].isValid, "Caller is not a valid doctor");
            require(patients[_patientAddress].authorizedProviders[msg.sender], "Doctor not authorized by patient");
        }

        patients[_patientAddress].records.push(Record({
            ipfsHash: _ipfsHash,
            recordType: _recordType,
            timestamp: block.timestamp,
            addedBy: msg.sender
        }));

        emit RecordAdded(_patientAddress, msg.sender, _ipfsHash, block.timestamp);
    }

    // --- 4. VIEW FUNCTIONS ---

    function getPatientRecords(address _patient) 
        public 
        view 
        validAddress(_patient)
        onlyRegisteredPatient(_patient) 
        returns (string[] memory, string[] memory, address[] memory) 
    {
        
        if (msg.sender != _patient) {
            require(patients[_patient].authorizedProviders[msg.sender], "Access Denied: Permission required");
        }

        uint length = patients[_patient].records.length;
        string[] memory hashes = new string[](length);
        string[] memory types = new string[](length);
        address[] memory authors = new address[](length);

        for(uint i = 0; i < length; i++) {
            Record storage rec = patients[_patient].records[i];
            hashes[i] = rec.ipfsHash;
            types[i] = rec.recordType;
            authors[i] = rec.addedBy;
        }

        return (hashes, types, authors);
    }

    // --- 5. HELPER VIEW FUNCTIONS ---

    function isPatientRegistered(address _patient) public view returns (bool) {
        return patients[_patient].isRegistered;
    }

    function isDoctorValid(address _doctor) public view returns (bool) {
        return doctors[_doctor].isValid;
    }

    function isAuthorized(address _patient, address _provider) public view returns (bool) {
        return patients[_patient].authorizedProviders[_provider];
    }

    function getRecordCount(address _patient) public view returns (uint256) {
        return patients[_patient].records.length;
    }
}
