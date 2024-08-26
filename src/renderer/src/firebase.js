import { initializeApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  updateProfile,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  updateDoc,
  setDoc,
  increment,
  getDocs,
  collection,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore'
import { getYear, getMonth } from 'date-fns'
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
  apiKey: import.meta.env.RENDERER_VITE_FIREBASE_API_KEY,
  authDomain: 'itsd-tools.firebaseapp.com',
  projectId: 'itsd-tools',
  storageBucket: 'itsd-tools.appspot.com',
  databaseURL: 'https://itsd-tools-default-rtdb.europe-west1.firebasedatabase.app/',
  messagingSenderId: '730668520505',
  appId: '1:730668520505:web:cceac07e86d18ed3fae9e8'
}

const firebaseApp = initializeApp(firebaseConfig) // Initialize Firebase
const auth = getAuth(firebaseApp) // Get Auth instance using the Firebase app
const db = getFirestore(firebaseApp) // Get Firestore instance using the Firebase app

// Enable local persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {

  })
  .catch((error) => {
    console.error('Error enabling local persistence:', error)
  })

async function updateMonthlyUsageCount(id, category) {
  try {
    // Construct the document ID using category prefix
    const documentId = `${category}_${id}`

    // Get the current year and month
    const currentDate = new Date()
    const currentYear = getYear(currentDate)
    const currentMonth = getMonth(currentDate) + 1 // January is 0, so we add 1

    // Construct the field path for the current month
    const fieldPath = `monthlyUsageCounts.${currentYear}-${currentMonth.toString().padStart(2, '0')}`

    // Get reference to the Firestore document
    const buttonRef = doc(db, 'button_clicks', documentId)

    // Update the monthlyUsageCounts field using Firestore's increment method
    await updateDoc(buttonRef, {
      [fieldPath]: increment(1) // Increment the value of the current month by 1
    })
  } catch (error) {
    console.error('Error updating monthly usage count:', error)
  }
}

async function createDocumentsFromArray(array, collectionName) {
  for (const element of array) {
    try {
      // Construct the document ID (you can use a unique ID or custom ID)
      const documentId = `${collectionName}_${element.id}`

      // Reference to the document in the specified collection
      const docRef = doc(db, 'button_clicks', documentId)

      // Create a new document object with the specified fields
      const newDocument = {
        category: collectionName,
        label: element.label !== undefined ? element.label : element.name,
        monthlyUsageCounts: {
          '2024-02': 0,
          '2024-03': 0,
          '2024-04': 0,
          '2024-05': 0,
          '2024-06': 0,
          '2024-07': 0,
          '2024-08': 0,
          '2024-09': 0,
          '2024-10': 0,
          '2024-11': 0,
          '2024-12': 0,
          '2025-01': 0,
          '2025-02': 0
        },
        totalUsageCount: 0
      }

      // Set document data
      await setDoc(docRef, newDocument)
      console.log(`Document created for ${element.id}`)
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }
}

async function getButtonStatistics() {
  try {
    const querySnapshot = await getDocs(collection(db, 'button_clicks'))
    const statistics = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Push the data to the statistics array
      statistics.push({
        id: doc.id,
        category: data.category,
        label: data.label,
        monthlyUsageCounts: data.monthlyUsageCounts
      })
    })

    return statistics
  } catch (error) {
    console.error('Error getting button statistics:', error)
    return [] // Return an empty array if an error occurs
  }
}

async function getDocumentsFromCollection(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Push the data to the documents array
      documents.push({
        id: doc.id,
        ...data
      });
    });

    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    return []; // Return an empty array if an error occurs
  }
}

async function getDocumentFromCollection(collectionName, documentId) {
  // Get a reference to the document
  const docRef = doc(db, collectionName, documentId);

  // Fetch the document
  const docSnapshot = await getDoc(docRef);

  if (docSnapshot.exists()) {
    // The document exists, return the data
    return docSnapshot.data();
  } else {
    // The document does not exist
    console.error('No such document!');
    return null;
  }
}

async function updateUserDocumentArray(userId, arrayName, newArray) {
  // Get a reference to the user document
  const userDoc = doc(db, 'users', userId);

  // Fetch the current array from the document
  const docSnapshot = await getDoc(userDoc);
  const currentArray = docSnapshot.data()[arrayName] || [];

  // Create a map of current items by their IDs
  const currentMap = new Map(currentArray.map(item => [item.id, item]));

  // Merge new items with existing items, preserving the "removed" property
  const mergedArray = newArray.map(newItem => {
    const currentItem = currentMap.get(newItem.id);
    if (currentItem && currentItem.removed !== undefined) {
      return { ...newItem, removed: currentItem.removed };
    }
    return newItem;
  });

  // Create an object with the array name as the key and the merged array as the value
  const update = {};
  update[arrayName] = mergedArray;

  // Update the user document
  await updateDoc(userDoc, update);
}

async function updateUserDocumentArrays(userId, updates) {
  // Get a reference to the user document
  const userDoc = doc(db, 'users', userId);

  // Fetch the current document data
  const docSnapshot = await getDoc(userDoc);
  const currentData = docSnapshot.data() || {};

  // Iterate over each array to update
  for (const [arrayName, newArray] of Object.entries(updates)) {
    const currentArray = currentData[arrayName] || [];

    // Create a map of current items by their IDs
    const currentMap = new Map(currentArray.map(item => [item.id, item]));

    // Merge new items with existing items, preserving the "removed" property
    const mergedArray = newArray.map(newItem => {
      const currentItem = currentMap.get(newItem.id);
      if (currentItem && currentItem.removed !== undefined) {
        return { ...newItem, removed: currentItem.removed };
      }
      return newItem;
    });

    // Update the current data with the merged array
    currentData[arrayName] = mergedArray;
  }

  // Update the user document with the combined data
  await updateDoc(userDoc, currentData);
}

async function updateUserDocumentArrayItem(collectionName, documentId, arrayName, itemId, newValue) {
  // Get a reference to the document
  const docRef = doc(db, collectionName, documentId);

  // Fetch the document
  const docSnapshot = await getDoc(docRef);

  if (docSnapshot.exists()) {
    // The document exists, get the data
    const data = docSnapshot.data();

    // Find the item in the array and update it
    const array = data[arrayName];
    const itemIndex = array.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      array[itemIndex].removed = newValue;
    }

    // Write the document back to Firestore
    await setDoc(docRef, data);
  } else {
    // The document does not exist
    console.error('No such document!');
  }
}

async function addCustomLinkFirebase(userId, newLink) {
  // Get a reference to the user document
  const userDoc = doc(db, 'users', userId);

  // Add an id to the new link
  newLink.id = uuidv4();

  // Add the new link to the customLinks array in the user document
  await updateDoc(userDoc, {
    customLinks: arrayUnion(newLink)
  });
}

async function removeCustomLinkFirebase(userId, idToRemove) {
  // Get a reference to the user document
  const userDoc = doc(db, 'users', userId);

  // Fetch the current document data
  const userDocData = (await getDoc(userDoc)).data();

  // Find the link with the matching id
  const linkToRemove = userDocData.customLinks.find(link => link.id === idToRemove);

  // If the link was found, remove it
  if (linkToRemove) {
    await updateDoc(userDoc, {
      customLinks: arrayRemove(linkToRemove)
    });
  }
}

let currentUser = null;
const handleAuthStateChange = (callback) => {
  onAuthStateChanged(auth, (user) => {
    if (user !== currentUser) {
      currentUser = user;
      callback(user);
    }
  });
};

const signout = () => {
  signOut(auth)
    .then(() => {
      // Perform any additional actions after sign out
      console.log('User signed out')
    })
    .catch((error) => {
      // Handle sign out error
      console.error('Error signing out:', error)
    })
}

const sendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

const updateDisplayName = async (displayName) => {
  try {
    const user = auth.currentUser
    await updateProfile(user, { displayName })
    console.log('Display name updated successfully')
  } catch (error) {
    console.error('Error updating display name:', error)
  }
}

const login = async (email, password) => {
  // Sign in with email and password
  return signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      // User is signed in
      console.log('User is logged in')
    })
    .catch((error) => {
      // Handle errors
      console.error('Error signing in:', error)
      throw error // Rethrow the error to be caught by the caller
    })
}

const resetPassword = async (email) => {
  if (!email) {
    throw new Error('Please enter your email address.')
  }

  try {
    // Send password reset email
    await sendPasswordResetEmail(getAuth(), email)
    console.log('Password reset email sent successfully.')
    return 'Password reset email sent successfully.'
  } catch (error) {
    // Handle errors
    console.error('Error sending password reset email:', error)
    throw error
  }
}

const createUserDocument = async (user, customLinks) => {
  const userDoc = doc(db, 'users', user.uid);

  // Check if the document exists
  const docSnapshot = await getDoc(userDoc);

  if (!docSnapshot.exists()) {
    // Create a new user document
    const newUser = {
      id: user.uid,
      commonTools: [],
      remoteAssistance: [],
      communications: [],
      customLinks: customLinks,
    };

    // Set the document data
    await setDoc(userDoc, newUser);
    console.log(`Document created with ID: ${user.uid}`);
  } else {
    console.log(`Document with ID: ${user.uid} already exists`);
  }
}

export {
  updateMonthlyUsageCount,
  createDocumentsFromArray,
  getButtonStatistics,
  getDocumentsFromCollection,
  getDocumentFromCollection,
  updateUserDocumentArray,
  updateUserDocumentArrays,
  updateUserDocumentArrayItem,
  addCustomLinkFirebase,
  removeCustomLinkFirebase,
  handleAuthStateChange,
  signout,
  sendVerificationEmail,
  updateDisplayName,
  login,
  resetPassword,
  createUserDocument,
  firebaseApp as default
}
