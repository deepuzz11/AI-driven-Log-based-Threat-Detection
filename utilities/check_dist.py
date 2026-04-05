import pandas as pd

df = pd.read_csv('UNSW_NB15_grouped_testing_class.csv')
print('Attack type distribution:')
print(df['attack_cat'].value_counts())
print(f'\nFirst attack type: {df.iloc[0]["attack_cat"]}')
print(f'Any DoS in first 200? {(df.head(200)["attack_cat"] == "DoS").sum()}')
