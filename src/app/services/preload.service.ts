import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class PreloadService {
    http = inject(HttpClient);
    loadAll() {
        const paths = ['assets/pictures/coffee_1.png',
            'assets/pictures/coffee_2.png',
            'assets/pictures/coffee_3.png',
            'assets/pictures/coffee_4.png',
            'assets/pictures/coffee_5.png',
            'assets/pictures/coffee_6.png',
        ];
        this.preloadImages(paths);
        this.preloadImagesComplex(paths);
    }

    preloadImages(paths: string[]): void {
        for (const path of paths) {            
            const img = new Image();
            img.src = path;
        }
    }

    preloadImagesComplex(paths: string[]) {
        const loadPromises: Promise<void>[] = paths.map((path) => {
            return new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.src = path;
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            });
        });
        return Promise.all(loadPromises);
    }
}