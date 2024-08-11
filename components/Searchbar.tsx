"use client"

import { scrapeAndStoreProduct } from '@/lib/actions';
import { hostname } from 'os';
import React, { FormEvent, useState } from 'react'

const Searchbar = () => {

    const [searchPrompt, setSearchPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false)
    const isValidAmazonProductUrl = (url: string) => {
        
        try {
            const parsedUrl = new URL(url);
            const horstName = parsedUrl.hostname;
            if( 
                horstName.includes('amazon.com') ||
                horstName.endsWith('amazon') ||
                horstName.includes('amazon.')
            ){
                return true
            }
        } catch (error) {
            return false;
        }
        return false;
    }
    const handleSubmit = async(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const isValidLink = isValidAmazonProductUrl(searchPrompt)

        if(!isValidLink) return alert('Please provide a valid Amazon link')

            try {
                setIsLoading(true);
                // Scrape the product page
                const product = await scrapeAndStoreProduct(searchPrompt);

            } catch (error) {
                console.log(error);
            } finally {
                setIsLoading(false);
              }
    }

    return (
    <form className='flex flex-wrap gap-4 mt-12' onSubmit={handleSubmit}>
        <input
            type = 'text'
            value = {searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder='Enter product link'
            className='searchbar-input'
        />

        <button className='searchbar-btn' type='submit'
            disabled = {searchPrompt === ''}
        >
           {isLoading ? 'Searching...' : 'Search'}
        </button>
    </form>
  )
}

export default Searchbar