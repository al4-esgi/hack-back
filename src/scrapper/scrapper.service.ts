import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";

@Injectable()
export class ScrapperService {
  async extractRestaurantImageUrls(url: string): Promise<string[]> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      const html = await response.text();
      const $ = cheerio.load(html);

      const images = $("img");
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const img = images.eq(i);
        const src =
          img.attr("src") ||
          img.attr("ci-src") ||
          img.attr("data-src") ||
          img.attr("data-image-source");

        if (!src) continue;

        if (src.includes("axwwgrkdco.cloudimg.io")) {
          const imageUrl = new URL(src, url).href;
          imageUrls.push(imageUrl);
        }
      }

      console.log(imageUrls);
      return imageUrls;
    } catch (error) {
      console.error("Error extracting image:", error);
      throw error;
    }
  }
}
