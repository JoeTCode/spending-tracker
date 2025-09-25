import { useAuth0 } from "@auth0/auth0-react";
import Auth0Icon from "../assets/icons/auth0-svgrepo-com.svg?react";
import { Link } from "react-router-dom";
const Login = () => {
    const { loginWithRedirect } = useAuth0();

    return (
		<div className="flex w-full justify-center mt-[20%] xl:mt-[5%]">
			<div className="flex flex-col bg-[#141212] w-120 h-150 pt-16 px-12 rounded-lg">
				<div className="flex flex-col w-full text-center">
					<h1 className="text-3xl font-bold">Welcome back</h1>
					<h2 className="text-neutral-400">Login to your TrackYourTransactions account</h2>
				</div>
				<form 
					action=""
					className="flex flex-col justify-between mt-[10%]"
				>
					<div className="flex flex-col gap-y-4">
						<div className="flex flex-col gap-y-2">
							<label for="first" className="font-bold">
								Username
							</label>
							<input type="text" id="first" name="first" 
								placeholder="name@example.com" required
								className="p-2 border-2 border-[#221f1f] rounded-lg placeholder-neutral-500"
							/>
						</div>
						
						<div className="flex flex-col gap-y-2">
							<label for="password" className="font-bold">
								Password
							</label>
							<input type="password" id="password" name="password" 
								placeholder="Your password" required
								className="p-2 border-2 border-[#221f1f] rounded-lg placeholder-neutral-500"
							/>
						</div>
					</div>
					
					<div className="text-center w-full bg-[#646cff] py-2 rounded-lg cursor-pointer mt-5">
						<button type="submit" className="cursor-pointer">
							Login
						</button>
					</div>
				</form>
				<div className="w-full text-center">
					<p className="text-sm text-neutral-400 mt-1">
						Don't have an account? <Link to='/register' className="underline underline-offset-3 decoration-1 text-[#646cff]"> Sign up </Link>
					</p>
				</div>
				<div className="flex flex-col text-center mt-20">

					<p className="flex-1 text-sm text-neutral-400">Or login with</p>
					
					<button 
						onClick={() => loginWithRedirect()}
						className="flex gap-x-2 justify-center items-center text-center bg-black py-2 rounded-lg cursor-pointer mt-5"
					>
						<Auth0Icon className="h-5 w-5 dark:bg-white rounded-sm" />
						<span className="">Auth0</span>
					</button>
				</div>

			</div>
		</div>
    );

};

export default Login;