import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";

export const maxDuration = 300; // This function can run for a maximum of 300 seconds
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {

    try {
        connectToDB();

        const product = await Product.find({});

        if(!product)  throw new Error("No product find");

        // 1. Scrape Latest product details and update db 
        const updatedProduct = await Promise.all(
            product.map(async(currentProduct) => {

                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
                if(!scrapedProduct) throw new Error("No product found");
                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    {price: currentProduct.currentPrice}
                ]
                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory)
                }
            
    
            const updatedProduct = await Product.findOneAndUpdate(
                {url: product.url},
                product,
            )
            // 2. CHECK EACH PRODUCT STATUS AND SEND EMAIL ACCORDINGLY
            const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);

            if(emailNotifType && updatedProduct.users.length > 0){
                const productInfo = {
                    title: scrapedProduct.title,
                    url: scrapedProduct.url
                }

                const emailContent = await generateEmailBody(productInfo,emailNotifType);

                const userEmails = updatedProduct.users.map((user: any)=> user.email);

                await sendEmail(emailContent,userEmails);
            }

            return updatedProduct;

            })
        )
        return NextResponse.json({
            message: 'Ok', data: updatedProduct
        })
        
        
    } catch (error) {
        throw new Error(`Error in GET:  , ${error}`);
        
    }
}