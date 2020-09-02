import React from 'react';
import * as firebase from 'firebase';

var firebaseConfig = {
    apiKey: "AIzaSyCvmRKXHtgIj8ALN1NtR2OS92A8Wm0vmKw",
    authDomain: "chikchik-2e8f0.firebaseapp.com",
    databaseURL: "https://chikchik-2e8f0.firebaseio.com",
    projectId: "chikchik-2e8f0",
    storageBucket: "chikchik-2e8f0.appspot.com",
    messagingSenderId: "442105351965",
    appId: "1:442105351965:web:3c1988239cd92e808b9bf4"
  };

  //Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  export default firebase;