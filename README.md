# PUBG-mapper

this map should working with https://github.com/jussihi/PUBG-map-hack

```
npm install
node index.js
```
mapper will running at `localhost:7890`.

you can change port at `index.js` `var port = 7890;`.


remmeber edit your PUBG-map-hack `CURLWrapper.hpp`:

```
	int sendData(std::string& w_data)
	{
		try
		{
			struct curl_slist *headers = NULL;

			headers = curl_slist_append(headers, "Content-Type: application/json");

			curl_easy_setopt(m_curl, CURLOPT_VERBOSE, 0L);
			curl_easy_setopt(m_curl, CURLOPT_HTTPHEADER, headers);
			curl_easy_setopt(m_curl, CURLOPT_URL, "http://127.0.0.1:7890/");  // <---- here
			curl_easy_setopt(m_curl, CURLOPT_CUSTOMREQUEST, "POST");          // <---- here
			// curl_easy_setopt(curl, CURLOPT_TIMEOUT_MS, 30L);
			curl_easy_setopt(m_curl, CURLOPT_WRITEFUNCTION, write_data);
			curl_easy_setopt(m_curl, CURLOPT_POSTFIELDS, w_data.data());
			curl_easy_setopt(m_curl, CURLOPT_NOSIGNAL, 1);

			curl_easy_perform(m_curl);

			curl_slist_free_all(headers);
			curl_easy_reset(m_curl);
		}
		catch (std::exception& e)
		{
			std::cout << e.what() << std::endl;
			return -1;
		}
	}
```
