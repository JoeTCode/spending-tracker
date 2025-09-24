import { useAuth0 } from "@auth0/auth0-react";

const Login = () => {
    const { loginWithRedirect } = useAuth0();

    return (
		<div className="flex w-full justify-center mt-[20%] xl:mt-[5%]">
			<div className="flex flex-col bg-[#141212] w-130 h-150 pt-16 px-12 rounded-lg">
				<div className="flex flex-col w-full text-center">
					<h1 className="text-3xl font-extrabold">Welcome back</h1>
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
								placeholder="Enter your Username" required
								className="p-2 bg-[#0f0f0f] rounded-lg"
							/>
						</div>
						
						<div className="flex flex-col gap-y-2">
							<label for="password" className="font-bold">
								Password
							</label>
							<input type="password" id="password" name="password" 
								placeholder="Enter your Password" required
								className="p-2 bg-[#0f0f0f] rounded-lg"
							/>
						</div>
					</div>
					
					<div className="text-center w-full bg-[#646cff] py-2 rounded-lg cursor-pointer mt-10">
						<button type="submit" className="cursor-pointer">
							Login
						</button>
					</div>
				</form>
				<div className="flex flex-col text-center mt-15">
					<p className="text-sm text-neutral-400">Or log in with</p>
					<button 
						onClick={() => loginWithRedirect()}
						className="bg-black py-2 rounded-lg cursor-pointer mt-5"
					>
						Auth0
					</button>
				</div>

			</div>
		</div>
    );

};

export default Login;