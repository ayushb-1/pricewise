"use server"

import { Session } from "inspector";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from "../utils";
import { exportTraceState } from "next/dist/trace";

export async function scrapeAmazonProduct(url:string) {
    if(!url) return;
    const username = String(process.env.BRIGHT_DATA_USERNAME)
    const password = String(process.env.BRIGHT_DATA_PASSWORD)

    // curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_5e830f96-zone-pricewise:z3ci2z1luoj0 -k "https://geo.brdtest.com/mygeo.json"
    const port = 22225;
    const session_id = (1000000 * Math.random()) | 0;
    
    const options ={
        auth : {
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
        timeout: 10000, // Increase timeout to 10 seconds

    }

    try {
        const response = await axios.get(url,options)
        const $ = cheerio.load(response.data);

        const title = $('#productTitle').text().trim();
        // console.log(title)

        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
          );
      
        //   const originalPrice = extractPrice(
        //     $('#priceblock_ourprice'),
        //     $('.a-price.a-text-price span.a-offscreen'),
        //     $('#listPrice'),
        //     $('#priceblock_dealprice'),
        //     $('.a-size-base.a-color-price')
        //   );

        const originalPrice = extractPrice(
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice')
        );
        
        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

        const images = $('#imageblkFront').attr('data-a-dynamic-image') ||
        $('#landingImage').attr('data-a-dynamic-image') ||
        '{}'

        const imageUrls = Object.keys(JSON.parse(images))
        const currency = extractCurrency($('.a-price-symbol'))
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");
        const description = extractDescription($);

        // console.log("currentPrice", currentPrice)
        // console.log("originalPrice", originalPrice)
        // console.log("outOfStock", outOfStock)
        // console.log("imageUrls", imageUrls)
        // console.log("currency", currency)

        const data = {
            url,
            currency: currency || '$',
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice),
            originalPrice: Number(originalPrice) || Number(currentPrice),
            priceHistory: [],
            discountRate: Number(discountRate),
            category: 'category',
            reviewsCount:100,
            stars: 4.5,
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),


        }
        return data;


    } catch (error: any) {
        throw new Error(`Failed to scrape product: ${error.message}`);
        
    }
}