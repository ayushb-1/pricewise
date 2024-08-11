#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

class Contact {
    private: 
        string name;
        string phn;
    
    public: 
        Contact(string n, string phn) : name(n), phn(phn) {}

        string getName() const { return name;}
        string getPhone() const { return phn;}
};

class PhoneBook {
    private: 
    vector<Contact> contacts;

    public: 
    void addContact(const Contact &contact) {
        contacts.push_back(contact);
    }

    void removeContact(const string &name) {
        auto it = remove_if(contacts.begin(), contacts.end(), [&name](const Contact &c){
            return c.getName() == name;
        });
        contacts.erase(it,contacts.end());
    }

    Contact* searchContact(const string& name){
        for(auto contact : contacts){
            if(contact.getName() == name){
                return &contact;
            }
        }
        return nullptr;
    }

};
