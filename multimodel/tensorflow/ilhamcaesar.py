#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Converted from Jupyter notebook: kaggle.ipynb
"""
# 1. importing

# Library yang sering digunakan
import os, shutil
import zipfile
import random
from random import sample
import shutil
from shutil import copyfile
import pathlib
from pathlib import Path
import numpy as np
import pandas as pd
from tqdm.notebook import tqdm as tq

# Libraries untuk pemrosesan data gambar
import cv2
from PIL import Image
import skimage
from skimage import io
from skimage.transform import resize
from skimage.transform import rotate, AffineTransform, warp
from skimage import img_as_ubyte
from skimage.exposure import adjust_gamma
from skimage.util import random_noise

# Libraries untuk pembangunan model
import keras
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report
import tensorflow as tf
from tensorflow.keras import Model, layers
from tensorflow.keras.preprocessing import image
from tensorflow.keras.preprocessing.image import ImageDataGenerator, img_to_array, load_img
from tensorflow.keras.optimizers import Adam, RMSprop, SGD
from tensorflow.keras.layers import InputLayer, Conv2D, SeparableConv2D, MaxPooling2D, MaxPool2D, Dense, Flatten, Dropout, BatchNormalization
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.applications import MobileNet
from tensorflow.keras.applications.densenet import DenseNet121
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import ModelCheckpoint, Callback, EarlyStopping, ReduceLROnPlateau

import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict
from pathlib import Path

print (tf.__version__)

import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

# 2. Load dataset testing & Distribusi data test

TRAIN_DIR = Path("/kaggle/input/datasets/ilhamcaa/dataset-project-dicoding/Data/train")

# Defaultdict list agar otomatis membuat list kosong jika kunci (label) belum ada
kumpulan_variabel = defaultdict(list)

# Iterasi seluruh gambar
for path_gambar in TRAIN_DIR.rglob("*.jpg"):
    label = path_gambar.parent.name
    
    # Masukkan path ke dalam label yang sesuai
    kumpulan_variabel[label].append(str(path_gambar))

# Sekarang Anda punya variabel dinamis:
print(f"Isi variabel fake_mask: {len(kumpulan_variabel['fake_mask'])} file.")

print(f"Isi variabel fake_mask: {len(kumpulan_variabel['realperson'])} file.")

# Extract file names from full paths
TRAIN_DIR = Path("/kaggle/input/datasets/ilhamcaa/dataset-project-dicoding/Data/train")
full_path = []
file_name = []
labels = []

for label in TRAIN_DIR.iterdir():
    if label.is_dir():
        for image_file in label.glob("*.jpg"):
            full_path.append(str(image_file))
            file_name.append(image_file.name)
            labels.append(label.name)

distribution_train = pd.DataFrame({"path": full_path, 'file_name': file_name, "labels": labels})

# Plot distribusi gambar di setiap kelas
Label = distribution_train['labels']
plt.figure(figsize=(6, 6))
sns.set_style("darkgrid")
plot_data = sns.countplot(Label)

# Karena data test tidak seimbang, kita akan melakukan data augmentation agar menghasilkan variasi dari data yang ada untuk kelas minoritas agar jumlahnya setara dengan kelas mayoritas. Kita akan menggunakan ImageDataGenerator dari Keras untuk melakukan augmentasi data.
# 
# Hasil augmentasi data akan disimpan ke dalam folder baru bernama "Data/test_augmented". Kita akan membuat subfolder untuk setiap kelas di dalam folder tersebut.

# ## Model Augmentation

import os
import cv2
import random
from random import sample
import numpy as np
import shutil
from pathlib import Path
from collections import defaultdict
from skimage.transform import AffineTransform, warp
from skimage.exposure import adjust_gamma

# ========================================================
# 1. DEFINISI FUNGSI AUGMENTASI & DICTIONARY
# ========================================================
def add_brightness(img):
    img = cv2.resize(img, (224,224))
    img = adjust_gamma(img, gamma=0.5, gain=1)
    return img
 
def blur_image(img):
    img = cv2.resize(img, (224,224))
    return cv2.GaussianBlur(img, (9,9), 0)
 
def sheared(img):
    img = cv2.resize(img, (224,224))
    transform = AffineTransform(shear=0.2)
    shear_image = warp(img, transform, mode="wrap")
    return shear_image
 
def warp_shift(img):
    img = cv2.resize(img, (224,224))
    transform = AffineTransform(translation=(0,40))
    warp_image = warp(img, transform, mode="wrap")
    return warp_image

transformations = {
    "brightness": add_brightness,
    "blur": blur_image,
    "shear": sheared,
    "warp": warp_shift
}

# ========================================================
# 2. SETUP PATH & PENGUMPULAN DATA
# ========================================================
TRAIN_DIR = Path("/kaggle/input/datasets/ilhamcaa/dataset-project-dicoding/Data/train")
TRAIN_AUGMENTED_DIR = Path("/kaggle/working/Data/train_augmented")


kumpulan_variabel = defaultdict(list)
for path_gambar in TRAIN_DIR.rglob("*.jpg"):
    label = path_gambar.parent.name
    kumpulan_variabel[label].append(str(path_gambar))

# Bersihkan folder augmented jika sebelumnya gagal di tengah jalan
if TRAIN_AUGMENTED_DIR.exists():
    shutil.rmtree(TRAIN_AUGMENTED_DIR)
TRAIN_AUGMENTED_DIR.mkdir(parents=True, exist_ok=True)

# Set target jumlah gambar
TARGET_COUNT_PER_CLASS = 2500

# ========================================================
# 3. PROSES PEMINDAHAN & AUGMENTASI
# ========================================================
for label_path in TRAIN_DIR.iterdir():
    if not label_path.is_dir():
        continue 
        
    label_name = label_path.name 
    label_dir = TRAIN_AUGMENTED_DIR / label_name
    label_dir.mkdir(parents=True, exist_ok=True)

    images_for_label = kumpulan_variabel.get(label_name, [])
    current_count = len(images_for_label)

    if current_count == 0:
        print(f"Skip {label_name}: tidak ada gambar.")
        continue

    # Tentukan gambar sumber
    if current_count >= TARGET_COUNT_PER_CLASS:
        selected_images = sample(images_for_label, TARGET_COUNT_PER_CLASS)
        images_to_augment = []
    else:
        selected_images = list(images_for_label)
        augment_needed = TARGET_COUNT_PER_CLASS - current_count
        images_to_augment = [random.choice(images_for_label) for _ in range(augment_needed)]

    print(f"Memproses {label_name}... (Target: {TARGET_COUNT_PER_CLASS})")

    # Simpan gambar asli
    for idx, img_path in enumerate(selected_images):
        img = cv2.imread(img_path)
        if img is None: continue
        filename = f"{label_name}_orig_{idx}.jpg"
        output_path = label_dir / filename
        cv2.imwrite(str(output_path), img)

    # Apply augmentasi untuk kekurangan gambar
    for idx, img_path in enumerate(images_to_augment):
        img = cv2.imread(img_path)
        if img is None: continue

        # Pilih transformasi random
        transform_name = random.choice(list(transformations.keys()))
        augmented_img = transformations[transform_name](img)

        filename = f"{label_name}_augmented_{idx}.jpg"
        output_path = label_dir / filename
        # Hasil dari skimage warp biasanya float 0.0-1.0, jadi harus dikali 255
        cv2.imwrite(str(output_path), (augmented_img * 255).astype(np.uint8))

    final_count = len(list(label_dir.glob("*.jpg")))
    print(f"Selesai {label_name}: {current_count} -> {final_count} gambar")

# # Model Training Menggunakan Resnet50

# # ==========================================
# # 2. DATA LOADING & PREPARATION
# # ==========================================
# Memuat data dari direktori yang telah dibersihkan ke dalam objek TensorFlow Dataset.

import os
import shutil
import tensorflow as tf
from pathlib import Path

# ==========================================
# A. PARAMETER & PATH
# ==========================================
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
SEED = 42

ORIGINAL_VAL_DIR = "/kaggle/input/datasets/ilhamcaa/dataset-project-dicoding/Data/val"
TRAIN_DIR = "/kaggle/working/Data/train_augmented"
VAL_DIR = "/kaggle/working/val_clean_training"

# ==========================================
# B. PERSIAPAN & PEMBERSIHAN FOLDER (ANTI-ERROR)
# ==========================================
print("Menyiapkan dan membersihkan direktori data...")

# 1. Siapkan folder validasi agar tidak NotFoundError
if not os.path.exists(VAL_DIR):
    shutil.copytree(ORIGINAL_VAL_DIR, VAL_DIR)
    print(f"✅ Berhasil menyalin data validasi ke {VAL_DIR}")

# 2. Fungsi Pembersih Ketat (Mencegah InvalidArgumentError)
def deep_clean_directory(directory):
    valid_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
    removed = 0
    
    # Hapus folder tersembunyi bawaan Kaggle/Jupyter
    for root, dirs, files in os.walk(directory, topdown=False):
        for name in dirs:
            if name == '.ipynb_checkpoints':
                shutil.rmtree(os.path.join(root, name))
                
    # Hapus file dengan ekstensi salah atau format data rusak
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            ext = os.path.splitext(file)[1].lower()
            
            # Cek ekstensi
            if ext not in valid_exts:
                os.remove(file_path)
                removed += 1
                continue
                
            # Uji baca ketat menggunakan engine TensorFlow
            try:
                img_bytes = tf.io.read_file(file_path)
                _ = tf.io.decode_image(img_bytes, expand_animations=False)
            except Exception:
                os.remove(file_path)
                removed += 1
                
    if removed > 0:
        print(f"   -> Dihapus {removed} file bermasalah di {directory}")
    else:
        print(f"   -> {directory} sudah bersih.")

print("Memeriksa Data Latih (Train)...")
deep_clean_directory(TRAIN_DIR)

print("Memeriksa Data Validasi (Val)...")
deep_clean_directory(VAL_DIR)

# ==========================================
# C. MEMUAT DATASET
# ==========================================
print("\nMemuat Data Latih...")
train_ds_resnet = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    label_mode="categorical",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=True
)

print("\nMemuat Data Validasi...")
val_ds_resnet = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR,
    label_mode="categorical",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=False
)

class_names = train_ds_resnet.class_names
num_classes = len(class_names)

# Optimasi Pipeline
AUTOTUNE = tf.data.AUTOTUNE
train_ds_resnet = train_ds_resnet.cache().prefetch(AUTOTUNE)
val_ds_resnet = val_ds_resnet.cache().prefetch(AUTOTUNE)

# # ==========================================
# # 3. MODEL ARCHITECTURE (FUNCTIONAL API)
# # ==========================================
# Membangun model menggunakan ResNet50 sebagai base model. Kita menggunakan Functional API untuk fleksibilitas arsitektur.

from tensorflow.keras import layers

print(f"Membangun model untuk {num_classes} kelas: {class_names}")

# 1. Load Pre-trained Model (ResNet50)
base_model = tf.keras.applications.ResNet50(
    include_top=False,
    weights="imagenet",
    input_shape=IMG_SIZE + (3,)
)
base_model.trainable = False # Freeze base model untuk tahap awal

# 2. Rangkaian Functional API
inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
# Preprocessing khusus ResNet50 dimasukkan ke dalam model
x = tf.keras.applications.resnet50.preprocess_input(inputs)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
# Layer output menyesuaikan jumlah kelas yang ada
outputs = layers.Dense(num_classes, activation="softmax")(x)

model_resnet50 = tf.keras.Model(inputs, outputs, name="resnet50_classifier")
model_resnet50.summary()

# # ==========================================
# # 4. CUSTOM COMPONENT & MODEL TRAINING
# # ==========================================
# Implementasi callback kustom (TargetAccuracyCallback) untuk menghentikan training secara otomatis jika target akurasi tercapai, lalu melakukan pelatihan model (Feature Extraction dan Fine-Tuning).

# Definisi Custom Callback
class TargetAccuracyCallback(tf.keras.callbacks.Callback):
    def __init__(self, target_val_acc):
        super(TargetAccuracyCallback, self).__init__()
        self.target_val_acc = target_val_acc

    def on_epoch_end(self, epoch, logs=None):
        val_acc = logs.get('val_accuracy')
        if val_acc is not None and val_acc >= self.target_val_acc:
            print(f"\n[INFO] Target Akurasi {self.target_val_acc} tercapai. Training dihentikan otomatis!")
            self.model.stop_training = True

# Menyiapkan List Callbacks
callbacks = [
    TargetAccuracyCallback(target_val_acc=0.98), # Target Akurasi Validasi 98%
    tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True),
    tf.keras.callbacks.ModelCheckpoint("/kaggle/working/best_model.keras", monitor="val_f1_score", mode="max", save_best_only=True)
]

# Tahap 1: Training Head (Feature Extraction)
model_resnet50.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss="categorical_crossentropy",
    metrics=["accuracy", tf.keras.metrics.F1Score(average='macro', name='f1_score')]
)

print("\n--- Memulai Training Tahap 1 (Head Only) ---")
model_resnet50.fit(train_ds_resnet, validation_data=val_ds_resnet, epochs=10, callbacks=callbacks)

# Tahap 2: Fine-tuning
print("\n--- Memulai Fine-tuning Tahap 2 ---")
base_model.trainable = True
# Bekukan sebagian layer awal, buka sisanya
for layer in base_model.layers[:-30]: 
    layer.trainable = False

# Recompile dengan Learning Rate lebih kecil
model_resnet50.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),
    loss="categorical_crossentropy",
    metrics=["accuracy", tf.keras.metrics.F1Score(average='macro', name='f1_score')]
)
model_resnet50.fit(train_ds_resnet, validation_data=val_ds_resnet, epochs=5, callbacks=callbacks)

# Simpan Model Final (Kriteria: Export Model .keras)
model_resnet50.save("/kaggle/working/model_final.keras")
print("\nModel disimpan di /kaggle/working/model_final.keras")

# # ==========================================
# # 5. INFERENCE (PREDIKSI GAMBAR BARU)
# # ==========================================
# Melakukan pengujian model yang telah dilatih (.keras) terhadap gambar untuk melihat kinerja model di dunia nyata.

import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing import image
import tensorflow as tf

# Tentukan gambar yang ingin diuji (Ganti path ini)
img_path = '/kaggle/input/datasets/ilhamcaa/dataset-project-dicoding/Data/val/fake_mask/contoh_gambar.jpg' 

def test_inference(img_path):
    print("Memuat model untuk Inference...")
    model = tf.keras.models.load_model("/kaggle/working/model_final.keras")
    
    # 1. Muat gambar dan resize
    img = image.load_img(img_path, target_size=(224, 224))
    
    # 2. Konversi ke array
    x = image.img_to_array(img)
    
    # 3. Tambahkan dimensi batch
    x = np.expand_dims(x, axis=0)
    
    # 4. Lakukan Prediksi
    preds = model.predict(x)
    
    # 5. Ekstrak Hasil
    predicted_idx = np.argmax(preds[0])
    confidence = np.max(preds[0]) * 100
    predicted_label = class_names[predicted_idx]
    
    # Tampilkan Gambar dan Hasil Prediksi
    plt.imshow(img)
    plt.title(f"Prediksi: {predicted_label} ({confidence:.2f}%)")
    plt.axis('off')
    plt.show()

# Jalankan Fungsi (Hilangkan tanda pagar jika path gambar sudah benar)
# test_inference(img_path)

# ## Keras Export

import os

# Tentukan path folder tujuan
save_dir = '/kaggle/working/model'

# Buat folder jika belum ada
if not os.path.exists(save_dir):
    os.makedirs(save_dir)
    print(f"Direktori {save_dir} berhasil dibuat.")


# Menyimpan model final ke dalam folder /kaggle/working/model/
model_resnet50.save(os.path.join(save_dir, 'model_final.keras'))
print(f"Model final disimpan di: {save_dir}/model_final.keras")

# ## Komparasi Model dengan Validation

import os
import shutil
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# ==========================================
# 1. SETUP PATH DAN MUAT MODEL
# ==========================================
MODEL_PATH = '/kaggle/working/model/model_final.keras'
VAL_DIR_ORIGINAL = '/kaggle/input/datasets/ilhamcaa/dataset-project-dicoding/Data/val'
VAL_DIR_CLEAN = '/kaggle/working/val_clean_eval_v2' # Menggunakan folder baru
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

print("1. Memuat model...")
model = load_model(MODEL_PATH)

# ==========================================
# 2. PEMBERSIHAN DATA EKSTRA KETAT
# ==========================================
print("\n2. Menyiapkan dan membersihkan data validasi secara ketat...")
if os.path.exists(VAL_DIR_CLEAN):
    shutil.rmtree(VAL_DIR_CLEAN)
shutil.copytree(VAL_DIR_ORIGINAL, VAL_DIR_CLEAN)

# Hapus folder .ipynb_checkpoints bawaan Kaggle
for root, dirs, files in os.walk(VAL_DIR_CLEAN, topdown=False):
    for name in dirs:
        if name == '.ipynb_checkpoints':
            shutil.rmtree(os.path.join(root, name))

# Ekstensi yang diizinkan oleh TensorFlow
valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
removed_count = 0

for root, dirs, files in os.walk(VAL_DIR_CLEAN):
    for file in files:
        file_path = os.path.join(root, file)
        ext = os.path.splitext(file)[1].lower()
        
        # Hapus jika ekstensi tidak valid
        if ext not in valid_extensions:
            os.remove(file_path)
            removed_count += 1
            continue
            
        # Uji baca langsung dengan mesin TensorFlow
        try:
            img_bytes = tf.io.read_file(file_path)
            _ = tf.io.decode_image(img_bytes, expand_animations=False)
        except Exception:
            os.remove(file_path)
            removed_count += 1

print(f"   Pembersihan selesai. {removed_count} file bermasalah/tersembunyi dihapus.")

# ==========================================
# 3. PEMUATAN DATASET & PREDIKSI
# ==========================================
print("\n3. Memuat dataset...")
val_ds = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR_CLEAN,
    label_mode='categorical',
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=False # PENTING: Jangan diacak
)

class_names = val_ds.class_names

print("   Mengekstraksi label asli dan menjalankan prediksi...")
y_true_classes = []
for images, labels in val_ds:
    y_true_classes.extend(np.argmax(labels.numpy(), axis=1))
y_true_classes = np.array(y_true_classes)

predictions = model.predict(val_ds)
y_pred_classes = np.argmax(predictions, axis=1)

# ==========================================
# 4. LAPORAN F1-SCORE DAN CONFUSION MATRIX
# ==========================================
print("\n4. Menghasilkan Laporan Evaluasi...")

print("\n--- CLASSIFICATION REPORT ---")
print(classification_report(y_true_classes, y_pred_classes, target_names=class_names))

print("\n--- CONFUSION MATRIX ---")
cm = confusion_matrix(y_true_classes, y_pred_classes)

plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=class_names, yticklabels=class_names)
plt.title('Confusion Matrix - Model vs Validasi Aktual')
plt.ylabel('Label Sebenarnya (True)')
plt.xlabel('Tebakan Model (Predicted)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# # ==========================================
# # INFERENCE MODEL (PREDIKSI GAMBAR BARU)
# # ==========================================
# # Melakukan pengujian model yang telah dilatih (.keras) terhadap satu gambar acak
# # dari sistem untuk melihat kinerja model di dunia nyata.

import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing import image
import tensorflow as tf
from tensorflow.keras.models import load_model

def test_inference(img_path):
    print("Memuat model untuk Inference...")
    model = tf.keras.models.load_model("/kaggle/working/model_final.keras")
    
    # 1. Muat gambar dan resize
    img = image.load_img(img_path, target_size=(224, 224))
    
    # 2. Konversi ke array
    x = image.img_to_array(img)
    
    # 3. Tambahkan dimensi batch
    x = np.expand_dims(x, axis=0)
    
    # 4. Lakukan Prediksi
    preds = model.predict(x)
    
    # 5. Ekstrak Hasil
    predicted_idx = np.argmax(preds[0])
    confidence = np.max(preds[0]) * 100
    predicted_label = class_names[predicted_idx]
    
    # Tampilkan Gambar dan Hasil Prediksi
    plt.imshow(img)
    plt.title(f"Prediksi: {predicted_label} ({confidence:.2f}%)")
    plt.axis('off')
    plt.show()

# (Optional) test with some image
# test_inference('/path/to/some/image.jpg')