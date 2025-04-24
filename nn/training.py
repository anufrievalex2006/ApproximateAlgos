import random
import numpy as np
from tensorflow.keras.datasets import mnist

inputSize = 784
hiddenSize = 256
outputSize = 10

alpha = 0.001
epochs = 10
batchSize = 50

def relu(t):
    return np.maximum(t, 0)
def reluDerivative(t):
    return (t >= 0).astype(float)

def softmaxBatch(t):
    out = np.exp(t)
    return out / np.sum(out, axis=1, keepdims=True)

def sparseCrossEntropyBatch(z, y):
    return -np.log(np.array([z[j, y[j]] for j in range(len(y))]))

def toFullBatch(y, num_classes):
    y_full = np.zeros((len(y), num_classes))
    for j, yj in enumerate(y):
        y_full[j, yj] = 1
    return y_full

(x_train, y_train), (x_test, y_test) = mnist.load_data()
x_train = x_train.reshape(-1, 784).astype(np.float32) / 255.0
x_test = x_test.reshape(-1, 784).astype(np.float32) / 255.0
y_train = y_train.astype(int)
y_test = y_test.astype(int)

dataset = [(x_train[i][None, ...], y_train[i]) for i in range(len(y_train))]

W1 = np.random.rand(inputSize, hiddenSize)
b1 = np.random.rand(1, hiddenSize)
W2 = np.random.rand(hiddenSize, outputSize)
b2 = np.random.rand(1, outputSize)

W1 = (W1 - 0.5) * 2 * np.sqrt(1/inputSize)
b1 = (b1 - 0.5) * 2 * np.sqrt(1/inputSize)
W2 = (W2 - 0.5) * 2 * np.sqrt(1/hiddenSize)
b2 = (b2 - 0.5) * 2 * np.sqrt(1/hiddenSize)

lossArr = []
for ep in range(epochs):
    random.shuffle(dataset)
    for i in range(len(dataset) // batchSize):

        batch_x, batch_y = zip(*dataset[i*batchSize : i * batchSize + batchSize])
        x = np.concatenate(batch_x, axis=0)
        y = np.array(batch_y)

        #forward
        t1 = x @ W1 + b1
        h1 = relu(t1)
        t2 = h1 @ W2 + b2
        z = softmaxBatch(t2)
        E = np.sum(sparseCrossEntropyBatch(z, y))

        #backward
        y_full = toFullBatch(y, outputSize)
        dE_dt2 = z - y_full
        dE_dW2 = h1.T @ dE_dt2
        dE_db2 = np.sum(dE_dt2, axis=0, keepdims=True)
        dE_dh1 = dE_dt2 @ W2.T
        dE_dt1 = dE_dh1 * reluDerivative(t1)
        dE_dW1 = x.T @ dE_dt1
        dE_db1 = np.sum(dE_dt1, axis=0, keepdims=True)

        #update
        W1 = W1 - alpha * dE_dW1
        b1 = b1 - alpha * dE_db1
        W2 = W2 - alpha * dE_dW2
        b2 = b2 - alpha * dE_db2

        lossArr.append(E)

def predict(x):
    t1 = x @ W1 + b1
    h1 = relu(t1)
    t2 = h1 @ W2 + b2
    z = softmaxBatch(t2)
    return z

def calcAccuracy():
    correct = 0
    for x, y in dataset:
        z = predict(x)
        y_pred = np.argmax(z)
        if y_pred == y:
            correct += 1
    acc = correct / len(dataset)
    return acc

accuracy = calcAccuracy()
print("Accuracy:", accuracy)

np.savetxt('W1.txt', W1)
np.savetxt('b1.txt', b1)
np.savetxt('W2.txt', W2)
np.savetxt('b2.txt', b2)
