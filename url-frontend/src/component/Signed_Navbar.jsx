
import { Link , Route , Routes} from "react-router-dom";
import { SignedIn, UserButton } from '@clerk/clerk-react';
import Home from "./Home";
import Myurl from "./Myurl";

function Signed_Navbar() {
    return (
        <SignedIn>
        <div>
          <nav className="flex w-full bg-gray-400  justify-between h-12 items-center">
            <div>
              <Link to="/" className="text-blue-800">Home</Link>
            </div>
            <div className="mr-2 flex justify-between items-center gap-3">
              <div>
                <Link to="/myurl" className="text-blue-800">My Urls</Link>
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