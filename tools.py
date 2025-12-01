import os
import json
import commentjson
import traceback
from datetime import datetime
from aiohttp import ClientSession
from PIL import Image
from io import BytesIO

import concurrent.futures
from datetime import datetime
from zoneinfo import ZoneInfo


class MyTools:



    # Monitor data
    def monitor(self,data):
        print('~'*100)
        print(json.dumps(data))
        print('#'*100)


    # Json Data Load Function
    def load_data(self, data_dir):
        json_data = {}
        def load_file(file): # helper function to read and load all json files in the target dir
            file_name = os.path.splitext(file)[0]
            file_path = os.path.join(data_dir, file)
            with open(file_path, "r", encoding="utf-8") as data:
                # return file_name, json.load(data)
                return file_name, commentjson.load(data)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            json_data.update(dict(executor.map(load_file, [f for f in os.listdir(data_dir) if f.endswith(".json")])))
        return json_data



    # Get Image Data for Checking Quality and start detection
    async def get_image_data_main(self, img_url, padding=100):
        try:
            async with ClientSession() as session:
                async with session.get(img_url) as response:
                    response.raise_for_status()
                    image = Image.open(BytesIO(await response.read()))
                    # image.thumbnail((1000, 1000))

                    # Add padding
                    # padded_image = ImageOps.expand(image, border=padding, fill='black')
                    # return padded_image
                    return image
        except Exception as e:
            traceback.print_exc()
            # return None
            raise ValueError(f"Invalid URL ==>>{img_url}<<== : {str(e)}")



    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, ZoneInfo("Asia/Dhaka"))
        if datefmt:
            s = dt.strftime(datefmt)
        else:
            s = dt.strftime("%Y-%m-%d %I:%M:%S %p")
        return s
