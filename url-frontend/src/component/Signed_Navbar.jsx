
import { Link , Route , Routes} from "react-router-dom";
import { SignedIn, UserButton } from '@clerk/clerk-react';
import Home from "./Home";
import Myurl from "./Myurl";
import {HomeIcon ,LinkIcon } from "lucide-react";

function Signed_Navbar() {
    return (
        <SignedIn>
        <div>
          <nav className="flex w-full bg-gray-400  justify-between h-14 items-center">
            <div>
              <Link to="/" className="text-black"><HomeIcon className="ml-2"/></Link>
            </div>
            <div className="mr-2 flex justify-between items-center gap-3">
              <div>
                <Link to="/myurl" className="text-black"><LinkIcon /></Link>
              </div>
              <div>
                <UserButton />
              </div>
            </div>
          </nav>
          <Routes>
            <Route path='/' element={<Home></Home>}></Route>
            <Route path='/myurl' element={<Myurl></Myurl>}></Route>
          </Routes>
        </div >
      </SignedIn >
    )
}

export default Signed_Navbar;