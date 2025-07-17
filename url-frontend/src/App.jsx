import Home from "./component/Home";
import Myurl from "./component/Myurl";
import { Link } from "react-router-dom";
import './index.css'
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton, RedirectToSignIn } from '@clerk/clerk-react';
import UnSigned_Navbar from "./component/UnSigned_Navbar";
import Signed_Navbar from "./component/Signed_Navbar";
function App() {
  return (
    <>
    <UnSigned_Navbar/>
    <Signed_Navbar/>
    </>
  );
}

export default App;