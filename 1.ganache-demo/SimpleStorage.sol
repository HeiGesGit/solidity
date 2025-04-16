// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract SimpleStorage {
    uint8 age;

    struct People {
        string name;
        uint8 age;
    }
    People[] public people;

    mapping(string => uint8) public nameToAge;

    function store(uint8 _age) public {
        age = _age;
    }

    function getAge() public view returns (uint8) {
        return age;
    }

    function addPreson(string memory _name, uint8 _age) public {
        people.push(People(_name, _age));
        nameToAge[_name] = _age;
    }
}
