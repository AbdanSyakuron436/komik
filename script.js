// Struktur data: Array komik, masing-masing { title, cover, description, chapters: [{ name, images }] }
let comics = JSON.parse(localStorage.getItem('comics')) || [];

// Fungsi untuk memuat daftar komik dan chapter di index.html
function loadComics() {
    const list = document.getElementById('comic-list');
    list.innerHTML = '';
    comics.forEach((comic, comicIndex) => {
        const comicDiv = document.createElement('div');
        comicDiv.className = 'comic-item';
        
        const cover = document.createElement('img');
        cover.className = 'comic-cover';
        cover.src = comic.cover || 'https://via.placeholder.com/100x150?text=No+Cover'; // Placeholder jika tidak ada sampul
        cover.onclick = () => {
            const chapterList = comicDiv.querySelector('.chapter-list');
            chapterList.style.display = chapterList.style.display === 'block' ? 'none' : 'block';
        };
        
        const info = document.createElement('div');
        info.className = 'comic-info';
        const title = document.createElement('div');
        title.className = 'comic-title';
        title.textContent = comic.title;
        title.onclick = cover.onclick; // Klik title juga expand
        
        const desc = document.createElement('div');
        desc.className = 'comic-description';
        desc.textContent = comic.description || 'Tidak ada deskripsi.';
        
        const chapterList = document.createElement('div');
        chapterList.className = 'chapter-list';
        comic.chapters.forEach((chapter, chapterIndex) => {
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.textContent = chapter.name;
            item.onclick = () => window.location.href = `reader.html?comic=${comicIndex}&chapter=${chapterIndex}`;
            chapterList.appendChild(item);
        });
        
        info.appendChild(title);
        info.appendChild(desc);
        comicDiv.appendChild(cover);
        comicDiv.appendChild(info);
        comicDiv.appendChild(chapterList);
        list.appendChild(comicDiv);
    });
}

// Fungsi untuk halaman baca
function loadReader() {
    const urlParams = new URLSearchParams(window.location.search);
    const comicIndex = parseInt(urlParams.get('comic'));
    const chapterIndex = parseInt(urlParams.get('chapter'));
    if (comicIndex >= 0 && comics[comicIndex] && chapterIndex >= 0 && comics[comicIndex].chapters[chapterIndex]) {
        const chapter = comics[comicIndex].chapters[chapterIndex];
        document.getElementById('chapter-title').textContent = `${comics[comicIndex].title} - ${chapter.name}`;
        const imagesDiv = document.getElementById('comic-images');
        imagesDiv.innerHTML = '';
        chapter.images.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            imagesDiv.appendChild(img);
        });

        // Navigasi chapter dalam komik yang sama
        document.getElementById('prev-chapter').onclick = () => {
            if (chapterIndex > 0) window.location.href = `reader.html?comic=${comicIndex}&chapter=${chapterIndex - 1}`;
        };
        document.getElementById('next-chapter').onclick = () => {
            if (chapterIndex < comics[comicIndex].chapters.length - 1) window.location.href = `reader.html?comic=${comicIndex}&chapter=${chapterIndex + 1}`;
        };
    }
}

// Fungsi untuk memuat datalist judul komik di admin.html
function loadComicDatalist() {
    const datalist = document.getElementById('comic-list');
    datalist.innerHTML = '';
    comics.forEach(comic => {
        const option = document.createElement('option');
        option.value = comic.title;
        datalist.appendChild(option);
    });
    
    // Toggle field berdasarkan input
    const input = document.getElementById('comic-title');
    input.oninput = () => {
        const title = input.value.trim();
        const isExisting = comics.some(comic => comic.title.toLowerCase() === title.toLowerCase());
        const newFields = document.getElementById('new-comic-fields');
        const cover = document.getElementById('comic-cover');
        const desc = document.getElementById('comic-description');
        if (isExisting || !title) {
            newFields.style.display = 'none';
            cover.required = false;
            desc.required = false;
        } else {
            newFields.style.display = 'block';
            cover.required = true;
            desc.required = true;
        }
    };
}

// Fungsi untuk load file sebagai Data URL dengan Promise
function loadFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`Gagal load file: ${file.name}`));
        reader.readAsDataURL(file);
    });
}

// Fungsi upload di admin.html
document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('comic-title').value.trim();
    const chapterName = document.getElementById('chapter-name').value.trim();
    const files = Array.from(document.getElementById('images').files);
    
    if (!title || !chapterName || files.length === 0) {
        alert('Isi semua field dan upload gambar chapter!');
        return;
    }
    
    const existingComic = comics.find(comic => comic.title.toLowerCase() === title.toLowerCase());
    let comicIndex;
    let cover, description;
    
    try {
        if (existingComic) {
            // Tambah chapter ke komik existing
            comicIndex = comics.indexOf(existingComic);
            cover = existingComic.cover;
            description = existingComic.description;
        } else {
            // Buat komik baru
            const coverFile = document.getElementById('comic-cover').files[0];
            if (!coverFile) {
                alert('Upload sampul untuk komik baru!');
                return;
            }
            cover = await loadFileAsDataURL(coverFile);
            description = document.getElementById('comic-description').value.trim();
            comics.push({ title, cover, description, chapters: [] });
            comicIndex = comics.length - 1;
        }
        
        // Load semua gambar chapter
        const images = await Promise.all(files.map(loadFileAsDataURL));
        
        // Push chapter
        comics[comicIndex].chapters.push({ name: chapterName, images });
        localStorage.setItem('comics', JSON.stringify(comics));
        alert('Chapter uploaded!');
        window.location.href = 'index.html';
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

// Jalankan fungsi sesuai halaman
if (window.location.pathname.includes('index.html')) {
    loadComics();
} else if (window.location.pathname.includes('reader.html')) {
    loadReader();
} else if (window.location.pathname.includes('admin.html')) {
    loadComicDatalist();
}