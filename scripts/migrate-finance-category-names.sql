-- Standardize the stored category labels without renaming physical tables/columns.
UPDATE keuangan_sampah SET kategori = 'Dana Kebersihan' WHERE kategori = 'Iuran Sampah';
UPDATE keuangan_keamanan SET kategori = 'Dana Keamanan' WHERE kategori = 'Iuran Keamanan';
