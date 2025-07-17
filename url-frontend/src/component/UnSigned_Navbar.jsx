
import { Link ,Routes, Route } from "react-router-dom";
import {SignInButton , SignedOut , RedirectToSignIn} from '@clerk/clerk-react';
import Home from "./Home";
import Myurl from "./Myurl";

function UnSigned_Navbar() {
    return (
<SignedOut>
          <nav className="flex w-full bg-gray-400  justify-between h-12 items-center">
            <div>
              <Link to="/" className="text-blue-800">Home</Link>
            </div>
            <div className="mr-2 flex justify-between items-center gap-3">
              <div>
                <Link to="/myurl" className="text-blue-800">My Urls</Link>
              </div>
              <div>
                <SignInButton mode="modal" />
              </div>
            </div>
          </nav>
        <Routes>
          <Route path='/' element={<Home></Home>}></Route>
          <Route path='/myurl' element={<RedirectToSignIn><Myurl /></RedirectToSignIn>}></Route>
        </Routes>
      </SignedOut>
    )
}

export default UnSigned_Navbar;