import os
import boto3
from decimal import Decimal

class StationRepository:
    def __init__(self):
        self.table_name = os.environ.get('TABLE_NAME', 'StationCache')
        # Use DynamoDB locally if no AWS env
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(self.table_name)
        
    def save_stations(self, stations):
        with self.table.batch_writer() as batch:
            for station in stations:
                # Convert floats to Decimals for DynamoDB
                item = {k: Decimal(str(v)) if isinstance(v, float) else v for k, v in station.items()}
                batch.put_item(Item=item)
                
    def get_recent_stations(self):
        # Scan is okay for small number of stations in a region for MVP
        response = self.table.scan()
        items = response.get('Items', [])
        # Convert Decimals back to float
        result = []
        for item in items:
            station = {k: float(v) if isinstance(v, Decimal) else v for k, v in item.items()}
            result.append(station)
        return result
