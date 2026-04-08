import os
import numpy as np
import pandas as pd
import time
import re
import joblib
from tensorflow.keras.layers import Input, Dense, LayerNormalization, MultiHeadAttention, Dropout, GlobalAveragePooling1D
from tensorflow.keras.models import Model, load_model
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

class DLModelEngine:
    def __init__(self, seq_len=10, model_path=None):
        self.seq_len = seq_len
        self.model = None
        self.preprocessor = None
        self.scaler = None
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "transformer_threat_model.h5")
        self.preprocessor_path = os.path.join(os.path.dirname(__file__), "dl_preprocessor.joblib")
        self.scaler_path = os.path.join(os.path.dirname(__file__), "dl_scaler.joblib")

    def transformer_block(self, inputs):
        x = MultiHeadAttention(key_dim=64, num_heads=4)(inputs, inputs)
        x = LayerNormalization()(x + inputs)
        ffn = Dense(128, activation="relu")(x)
        ffn = Dense(inputs.shape[-1])(ffn)
        return LayerNormalization()(x + ffn)

    def build_model(self, input_shape):
        inputs = Input(shape=(self.seq_len, input_shape))
        x = self.transformer_block(inputs)
        x = self.transformer_block(x)
        x = GlobalAveragePooling1D()(x)
        x = Dense(64, activation="relu")(x)
        x = Dropout(0.3)(x)
        outputs = Dense(1, activation="sigmoid")(x)
        
        model = Model(inputs, outputs)
        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
        return model

    def load(self):
        """Load pre-trained model and preprocessing tools if they exist"""
        try:
            if os.path.exists(self.model_path):
                # We need to provide custom_objects for custom layers
                self.model = load_model(self.model_path, custom_objects={'transformer_block': self.transformer_block})
                print(f"[DL ENGINE] Loaded model from {self.model_path}")
            
            if os.path.exists(self.preprocessor_path):
                self.preprocessor = joblib.load(self.preprocessor_path)
                print(f"[DL ENGINE] Loaded preprocessor from {self.preprocessor_path}")
            
            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
                print(f"[DL ENGINE] Loaded scaler from {self.scaler_path}")
                
            return self.model is not None
        except Exception as e:
            print(f"[DL ENGINE] Error loading model: {e}")
            return False

    def save(self):
        """Save model and preprocessing tools"""
        if self.model:
            self.model.save(self.model_path)
        if self.preprocessor:
            joblib.save(self.preprocessor, self.preprocessor_path)
        if self.scaler:
            joblib.save(self.scaler, self.scaler_path)

    def preprocess_sequence(self, df_seq):
        """Preprocess a sequence of logs (DataFrame)"""
        if self.preprocessor is None or self.scaler is None:
            return None
        
        X_cat = self.preprocessor.transform(df_seq)
        X_scaled = self.scaler.transform(X_cat)
        if hasattr(X_scaled, "toarray"):
            X_scaled = X_scaled.toarray()
            
        # Reshape to (1, seq_len, features)
        return np.expand_dims(X_scaled, axis=0)

    def predict_sequence(self, df_seq):
        """Predict threat probability for a sequence of logs"""
        if self.model is None:
            return 0.0
        
        X = self.preprocess_sequence(df_seq)
        if X is None:
            return 0.0
            
        prob = self.model.predict(X, verbose=0)[0][0]
        return float(prob)

    def train_from_df(self, train_df, epochs=1):
        """Train model using a provided DataFrame"""
        print("[DL ENGINE] Training starting...")
        
        # Prepare targets
        train_df["target"] = train_df["attack_cat"].apply(lambda x: 0 if x.lower() in ["benign", "normal"] else 1)
        
        cat_cols = ["proto", "service", "state"]
        drop_cols = ["id", "attack_cat", "label", "target"]
        if "4_class" in train_df.columns:
            drop_cols.append("4_class")
            
        X = train_df.drop(columns=[c for c in drop_cols if c in train_df.columns])
        y = train_df["target"]
        
        # Preprocessing
        self.preprocessor = ColumnTransformer(
            transformers=[("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)],
            remainder="passthrough"
        )
        X_processed = self.preprocessor.fit_transform(X)
        
        self.scaler = StandardScaler(with_mean=False)
        X_scaled = self.scaler.fit_transform(X_processed).toarray()
        
        # Create sequences
        def create_sequences(X_data, y_data, seq_len):
            X_seq, y_seq = [], []
            for i in range(len(X_data) - seq_len):
                X_seq.append(X_data[i:i+seq_len])
                y_seq.append(1 if np.any(y_data.iloc[i:i+seq_len].values == 1) else 0)
            return np.array(X_seq), np.array(y_seq)
            
        X_train_seq, y_train_seq = create_sequences(X_scaled, y, self.seq_len)
        
        # Build and train
        self.model = self.build_model(X_train_seq.shape[2])
        self.model.fit(X_train_seq, y_train_seq, epochs=epochs, batch_size=64, verbose=1)
        
        self.save()
        print("[DL ENGINE] Training complete and model saved.")

dl_engine = DLModelEngine()
