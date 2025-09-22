import { useAuth0 } from "@auth0/auth0-react";

const Login = () => {
    const { loginWithRedirect } = useAuth0();

    return (
		<div className="flex w-full justify-center mt-[20%] xl:mt-[5%]">
			<div className="flex flex-col bg-[#141212] w-160 h-160 p-16">
				<div className="flex flex-col w-full text-center">
					<h1 className="text-3xl font-semibold">Login to Track Your Transactions</h1>
					<h2 className="text-neutral-400">Please use one of the below login methods to continue</h2>
				</div>
				<form 
					action=""
					className="flex flex-col justify-between mt-[10%] h-full"
				>
					<div className="flex flex-col gap-y-6">
						<div className="flex flex-col gap-y-2">
							<label for="first">
								Username:
							</label>
							<input type="text" id="first" name="first" 
								placeholder="Enter your Username" required
								className="p-2 bg-black rounded-lg"
							/>
						</div>
						
						<div className="flex flex-col gap-y-2">
							<label for="password">
								Password:
							</label>
							<input type="password" id="password" name="password" 
								placeholder="Enter your Password" required
								className="p-2 bg-black rounded-lg"
							/>
						</div>
					</div>
					
					<div className="text-center w-full bg-[#646cff] py-3 rounded-lg cursor-pointer">
						<button type="submit" className="cursor-pointer">
							Submit
						</button>
					</div>
				</form>
				<button 
					onClick={() => loginWithRedirect()}
					className="bg-black py-3 rounded-lg mt-5 cursor-pointer"
				>
					Log In With Auth0
				</button>
			</div>
		</div>
    );

};

export default Login;