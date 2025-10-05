import { useAuth0 } from "@auth0/auth0-react";
import Auth0Icon from "../assets/icons/auth0-svgrepo-com.svg?react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { useInternalAuth } from "../components/useInternalAuth";

const Login = () => {
    const { loginWithRedirect } = useAuth0();
	const [ username, setUsername ] = useState("");
	const [ password, setPassword ] = useState("");
	const [ invalidLogin, setInvalidLogin ] = useState(false);
	const navigate = useNavigate();
	const { user, login } = useInternalAuth();

	// If user is already logged in deny access to Login page
	if (user) return <Navigate to="/" replace />;

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!username || !password) {
			setUsername("");
			setPassword("");
			return;
		};

		try {
			await login(username, password);
			navigate("/");
		} catch (err) {
			setUsername("");
			setPassword("");
			if (err.response.data === "Invalid username or password") {
				setInvalidLogin(true);
			};
		};
	};

    return (
		<div className="flex w-full justify-center mt-[20%] xl:mt-[5%]">
			<div className="flex flex-col border border-neutral-300 shadow-sm dark:shadow-none dark:border-none dark:bg-darker w-120 h-full pt-16 pb-10 px-12 rounded-lg">
				<div className="flex flex-col w-full text-center">
					<h1 className="text-3xl font-bold">Welcome back</h1>
					<h2 className="text-neutral-400">Login to your TrackYourTransactions account</h2>
				</div>
				<form 
					onSubmit={handleSubmit}
					className="flex flex-col justify-between mt-[10%]"
				>
					<div className="flex flex-col gap-y-4">
						{invalidLogin && (
							<div className="text-red-300">Invalid username or password</div>
						)}
						<div className="flex flex-col gap-y-2">
							<label htmlFor="first" className="font-bold">
								Username
							</label>
							<input type="text" id="first" name="first" 
								placeholder="johndoe" required
								className="p-2 border border-neutral-300 dark:border-2 dark:border-darker rounded-lg placeholder-neutral-500"
								onChange={(e) => setUsername(e.target.value)}
								value={username}
							/>
						</div>
						
						<div className="flex flex-col gap-y-2">
							<label htmlFor="password" className="font-bold">
								Password
							</label>
							<input type="password" id="password" name="password" 
								placeholder="Your password" required
								className="p-2 border border-neutral-300 dark:border-2 dark:border-darker rounded-lg placeholder-neutral-500"
								onChange={(e) => setPassword(e.target.value)}
								value={password}
							/>
						</div>
					</div>
					
					<div className="text-center w-full bg-purple hover:bg-dark-purple rounded-lg cursor-pointer mt-5">
						<button type="submit" className="cursor-pointer w-full p-2">
							Login
						</button>
					</div>
				</form>
				<div className="w-full text-center">
					<p className="text-sm text-neutral-400 mt-1">
						Don't have an account? <Link to='/register' className="underline underline-offset-3 decoration-1 text-dark-purple"> Sign up </Link>
					</p>
				</div>
				<div className="flex flex-col text-center mt-20">

					<p className="flex-1 text-sm text-neutral-400">Or login with</p>
					
					<button 
						onClick={() => loginWithRedirect()}
						className="flex gap-x-2 justify-center items-center text-center bg-black py-2 rounded-lg cursor-pointer mt-5"
					>
						<Auth0Icon className="h-5 w-5 bg-white rounded-sm" />
						<span className="text-white">Auth0</span>
					</button>
				</div>

			</div>
		</div>
    );

};

export default Login;