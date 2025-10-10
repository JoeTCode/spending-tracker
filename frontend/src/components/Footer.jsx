import Heart from '../assets/icons/heart-svgrepo-com.svg?react';

const IconCredit = ({ iconNameLink, iconName, authorLink, author, licenseLink, license }) => (
    <div className="text-sm">
        <div className="flex flex-col text-xs text-muted-foreground">
            <a
                href={iconNameLink}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
            >
                {iconName}
            </a>
            <a
                href={authorLink}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-neutral-400"
            >
                {author}&nbsp;
            </a>
            <a
                href={licenseLink}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-neutral-400"
            >
                - {license}
            </a>
        </div>
    </div>
);

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-16 border-t border-neutral-200 dark:border-neutral-700 bg-white/30 dark:bg-dark/30">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {/* Credits Section */}
                    <div>
                        <h4 className="mb-3">Credits & Attributions</h4>
                        <p className="text-sm text-muted-foreground text-neutral-400">
                            Built with modern open-source technologies
                        </p>
                    </div>
                    {/* Icon Library */}
                    <div className="col-span-2">
                        <h4 className="mb-3">
                            Icons - Courtesy of{" "}
                            <span className="inline-flex items-center gap-1">
                                <a
                                    href="https://www.svgrepo.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                >
                                    SVGRepo
                                </a>
                            </span>
                        </h4>
                        <div className="grid grid-cols-4 gap-2">

                        <IconCredit 
                            iconNameLink={"https://www.svgrepo.com/svg/523243/card-transfer"}
                            iconName={"Card Transfer"}
                            authorLink={"https://www.svgrepo.com/author/Solar%20Icons/"}
                            author={"Solar Icons"}
                            licenseLink={"https://creativecommons.org/licenses/by/4.0/"}
                            license={"CC Attribution License"}
                        />
                        <IconCredit 
                            iconNameLink={"https://www.svgrepo.com/svg/507640/dashboard"}
                            iconName={"Dashboard"}
                            authorLink={"https://www.svgrepo.com/author/scarlab/"}
                            author={"scarlab"}
                            licenseLink={"https://mit-license.org/"}
                            license={"MIT License"}
                        />
                        <IconCredit 
                            iconNameLink={"https://www.svgrepo.com/svg/458629/date-range"}
                            iconName={"Date Range"}
                            authorLink={"https://www.svgrepo.com/author/Leonid%20Tsvetkov/"}
                            author={"Leonid Tsvetkov"}
                            licenseLink={"https://creativecommons.org/licenses/by/4.0/"}
                            license={"CC Attribution License"}
                        />
                        <IconCredit 
                            iconNameLink={"https://www.svgrepo.com/svg/491147/tick"}
                            iconName={"Tick"}
                            authorLink={"https://www.svgrepo.com/author/Will%20Kelly/"}
                            author={"Will Kelly"}
                            licenseLink={"https://mit-license.org/"}
                            license={"MIT License"}
                        />

                        <IconCredit 
                            iconNameLink={"https://www.svgrepo.com/svg/358326/transaction"}
                            iconName={"Transaction"}
                            authorLink={"https://www.svgrepo.com/author/Iconscout/"}
                            author={"Iconscout"}
                            licenseLink={"https://www.apache.org/licenses/LICENSE-2.0"}
                            license={"Apache License"}
                        />
                        <IconCredit 
                            iconNameLink={"https://www.svgrepo.com/svg/525562/undo-left-round"}
                            iconName={"Undo Left Round"}
                            authorLink={"https://www.svgrepo.com/author/Solar%20Icons/"}
                            author={"Solar Icons"}
                            licenseLink={"https://creativecommons.org/licenses/by/4.0/"}
                            license={"CC Attribution License"}
                        />
                        <IconCredit 
                            iconNameLink={"https://www.svgrepo.com/svg/524190/undo-right-round"}
                            iconName={"Undo Right Round"}
                            authorLink={"https://www.svgrepo.com/author/Solar%20Icons/"}
                            author={"Solar Icons"}
                            licenseLink={"https://creativecommons.org/licenses/by/4.0/"}
                            license={"CC Attribution License"}
                        />
                        </div>
                        
                    </div>

                    {/* Other Libraries */}
                    <div>
                        <h4 className="mb-3">UI Components & Charts</h4>
                        <div className="space-y-3">
                            <div className="text-sm">
                                <a 
                                    href="https://tailwindcss.com/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    TailwindCSS
                                </a>
                                <p className="text-xs text-muted-foreground text-neutral-400">MIT License</p>
                                <p className="text-xs text-muted-foreground text-neutral-400">© Tailwind Labs</p>
                            </div>
                            <div className="text-sm">
                                <a 
                                    href="https://recharts.org" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Recharts
                                </a>
                                <p className="text-xs text-muted-foreground text-neutral-400">MIT License</p>
                            </div>
                            <div className="text-sm">
                                <a 
                                    href="https://www.ag-grid.com/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    AgGrid
                                </a>
                                <p className="text-xs text-muted-foreground text-neutral-400">MIT License</p>
                                <p className="text-xs text-muted-foreground text-neutral-400">© 2015-2025 AG GRID LTD</p>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="text-neutral-200 dark:text-neutral-700"></hr>

                {/* Footer Bottom */}
                <div className="my-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <span>Made with</span>
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        <span>using open source software</span>
                    </div>
                    <div>
                        <span>© {currentYear} TrackYourTransactions</span>
                    </div>
                </div>

                {/* License Details */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 text-xs text-muted-foreground">
                    <p className="mb-2">
                        <strong>License Information:</strong>
                    </p>
                    <p className="text-neutral-400">
                        All icon assets are provided by SVGRepo. 
                        UI components are built with TailwindCSS (MIT License). 
                        Charts and Grids are powered by Recharts and AgGrid (MIT License).
                        These open-source libraries are freely available for use, modification, and distribution 
                        under their respective license terms.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;