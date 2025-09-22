import { useState, useEffect } from 'react';

const UploadProgress = ({ stage }) => {

    const uploadActive = stage.toLowerCase() === 'upload';
    const mapColumnsActive = stage.toLowerCase() === 'mapcolumns';
    const checkDuplicatesActive = stage.toLowerCase() === 'reviewduplicates';
    const reviewActive = stage.toLowerCase() === 'review';

    return (
        <div className="flex items-center w-full">
            <div className='flex w-full sm:pl-10 mb-26'> 
                <div className='flex w-24'>
                    <div className='text-center'> 
                        <span className={ uploadActive ?
                            'border-3 border-[#747bff] rounded-full py-1 px-[11px] font-extrabold text-white' :
                            'border-2 rounded-full py-1 px-[10px] text-gray-400 font-bold'
                        }> 1 </span> 
                        <div className={ uploadActive ?
                            'mt-2 font-semibold text-white' :
                            'mt-2 text-gray-400'
                        }> Upload </div>
                    </div> 
                </div>

                <div className="flex-1 h-[2px] rounded-lg mt-4 bg-gray-300 w-full mr-10"/>

                <div className='flex w-32'>
                    <div className='text-center'> 
                        <span className={ mapColumnsActive ?
                            'border-3 border-[#747bff] rounded-full py-1 px-[10px] font-extrabold text-white' :
                            'border-2 rounded-full py-1 px-[10px] text-gray-400 font-bold'
                        }> 2 </span> 
                        <div className={ mapColumnsActive ?
                            'mt-2 font-semibold text-white' :
                            'mt-2 text-gray-400'
                        }> Map Columns </div>
                    </div> 
                </div>

                <div className="flex-1 h-[2px] rounded-lg mt-4 bg-gray-300 w-full mr-10"/>
                
                <div className='flex w-40'>
                    <div className='text-center'> 
                        <span className={ checkDuplicatesActive ?
                            'border-3 border-[#747bff] rounded-full py-1 px-[11px] font-extrabold text-white' :
                            'border-2 rounded-full py-1 px-[10px] text-gray-400 font-bold'
                        }> 3 </span> 
                        <div className={ checkDuplicatesActive ?
                            'mt-2 font-semibold text-white' :
                            'mt-2 text-gray-400'
                        }> Check Duplicates </div>
                    </div> 
                </div>

                <div className="flex-1 h-[2px] rounded-lg mt-4 bg-gray-300 mr-10"/>
                
                <div className='flex w-24'>
                    <div className='text-center'> 
                        <span className={ reviewActive ?
                            'border-3 border-[#747bff] rounded-full py-1 px-[10px] font-extrabold text-white' :
                            'border-2 rounded-full py-1 px-[10px] text-gray-400'
                        }> 4 </span>
                        <div className={ reviewActive ?
                            'mt-2 font-semibold text-white' :
                            'mt-2 text-gray-400'
                        }> Review </div>
                    </div>
                </div>                
            </div>
        </div>
    );
};

export default UploadProgress;