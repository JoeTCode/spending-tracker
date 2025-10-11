import { Link, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useInternalAuth } from "../components/useInternalAuth";

const Register = () => {
	const [ username, setUsername ] = useState("");
	const [ password, setPassword ] = useState("");
	const [ email, setEmail ] = useState("");
	const [ invalidRegister, setInvalidRegister ] = useState(false);
	const navigate = useNavigate();
	const { user } = useInternalAuth();

	// If user is already logged in deny access to Register page
	if (user) return <Navigate to="/" replace />;

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (email && username && password) {
			try {
				await axios.post(import.meta.env.VITE_API_URL + "/register", 
					{ 
						email: email, 
						username: username, 
						password: password 
					}
				);
				navigate('/login');
			} catch (err) {
				setUsername("");
				setPassword("");
				setEmail("");
				if (err.response.status === 409) setInvalidRegister(true);
			};
		};
	};

    return (
		<div className="flex w-full justify-center mt-[20%] xl:mt-[5%]">
			<div className="flex flex-col border border-neutral-300 dark:border-none dark:bg-darker w-120 pb-30 pt-16 px-12 rounded-lg">
				<div className="flex flex-col w-full text-center">
					<h1 className="text-3xl font-bold">Register</h1>
					<h2 className="text-neutral-400">Track your spending with TrackYourTransactions</h2>
				</div>
				<form 
					onSubmit={handleSubmit}
					className="flex flex-col justify-between mt-[10%]"
				>
					<div className="flex flex-col gap-y-4">
						{invalidRegister && (
							<div className="text-red-300">Please choose unique email or username</div>
						)}

						<div className="flex flex-col gap-y-2">
							<label htmlFor="email" className="font-bold">
								Email
							</label>
							<input type="email" id="email" name="email" 
								placeholder="johndoe@example.com" required
								className="p-2 border border-neutral-300 dark:border-neutral-800 rounded-lg placeholder-neutral-500"
								onChange={(e) => setEmail(e.target.value)}
								value={email}
							/>
						</div>

                        <div className="flex flex-col gap-y-2">
							<label htmlFor="username" className="font-bold">
								Username
							</label>
							<input type="text" id="username" name="username" 
								placeholder="johndoe" required
								className="p-2 border border-neutral-300 dark:border-neutral-800 rounded-lg placeholder-neutral-500"
								onChange={(e) => setUsername(e.target.value)}
								value={username}
							/>
						</div>
						
						<div className="flex flex-col gap-y-2">
							<label htmlFor="password" className="font-bold">
								Password
							</label>
							<input type="password" id="password" name="password" 
								placeholder="Create password" required
								className="p-2 border border-neutral-300 dark:border-neutral-800 rounded-lg placeholder-neutral-500"
								onChange={(e) => setPassword(e.target.value)}
								value={password}
							/>
						</div>
					</div>
					
					<div className="text-center w-full bg-purple hover:bg-dark-purple rounded-lg cursor-pointer mt-5">
						<button type="submit" className="cursor-pointer w-full py-2">
							Sign up
						</button>
					</div>
				</form>
				<div className="w-full text-center">
					<p className="text-sm text-neutral-400 mt-1">
						Already have an account? <Link to='/login' className="underline underline-offset-3 decoration-1 text-dark-purple"> Login </Link>
					</p>
				</div>

			</div>
		</div>
    );

};

export default Register;